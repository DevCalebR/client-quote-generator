import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm, type FieldPath } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { getRate } from '../features/fx/rates'
import { calculateTotals } from '../features/quotes/calc'
import { saveQuote } from '../features/quotes/storage'
import type { CurrencyCode, ProjectType, Quote } from '../features/quotes/types'
import { getSettings } from '../features/settings/storage'
import { formatCurrency } from '../lib/format'

const projectTypeValues = ['website', 'mobile-app', 'branding', 'marketing', 'other'] as const

const lineItemSchema = z.object({
  description: z.string().trim().min(2, 'Description must be at least 2 characters.'),
  qty: z
    .number({ error: 'Quantity is required.' })
    .int('Quantity must be a whole number.')
    .min(1, 'Quantity must be at least 1.'),
  unitPrice: z
    .number({ error: 'Unit price is required.' })
    .min(0, 'Unit price cannot be negative.'),
})

const intakeSchema = z.object({
  client: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
    email: z.string().trim().email('Enter a valid email address.'),
    company: z.string().trim().max(120, 'Company must be 120 characters or less.').optional(),
  }),
  scope: z.object({
    projectType: z.enum(projectTypeValues),
    description: z.string().trim().min(10, 'Scope description must be at least 10 characters.'),
    desiredStartDate: z
      .string()
      .min(1, 'Choose a desired start date.')
      .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date.'),
  }),
  lineItems: z.array(lineItemSchema).min(1, 'Add at least one line item.'),
  taxRate: z
    .number({ error: 'Tax rate is required.' })
    .min(0, 'Tax rate cannot be negative.')
    .max(15, 'Tax rate must be 15% or lower.'),
  discount: z
    .number({ error: 'Discount is required.' })
    .min(0, 'Discount cannot be negative.')
    .max(30, 'Discount must be 30% or lower.'),
})

type IntakeFormValues = z.infer<typeof intakeSchema>

type ConversionState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | {
      kind: 'ready'
      asOf: string
      convertedTotal: number
      rate: number
    }
  | { kind: 'error'; message: string }

const stepFields: Array<FieldPath<IntakeFormValues>[]> = [
  ['client.name', 'client.email', 'client.company'],
  ['scope.projectType', 'scope.description', 'scope.desiredStartDate'],
  ['lineItems'],
  ['taxRate', 'discount'],
]

const steps = [
  {
    title: 'Client',
    description: 'Who is this quote for?',
  },
  {
    title: 'Scope',
    description: 'What work is being quoted?',
  },
  {
    title: 'Line Items',
    description: 'Build and edit billable items.',
  },
  {
    title: 'Review',
    description: 'Set rates and create the quote.',
  },
]

export function IntakePage() {
  const navigate = useNavigate()
  const [settings] = useState(() => getSettings())
  const baseCurrency = settings.baseCurrency
  const clientCurrency = settings.clientCurrency
  const shouldShowConversion = baseCurrency !== clientCurrency

  const [activeStep, setActiveStep] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [conversionState, setConversionState] = useState<ConversionState>({ kind: 'idle' })

  const initialValues = useMemo<IntakeFormValues>(
    () => ({
      client: {
        name: '',
        email: '',
        company: '',
      },
      scope: {
        projectType: 'website',
        description: '',
        desiredStartDate: '',
      },
      lineItems: [{ description: '', qty: 1, unitPrice: 0 }],
      taxRate: settings.taxRateDefault ?? 8,
      discount: 0,
    }),
    [settings.taxRateDefault],
  )

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    trigger,
    watch,
  } = useForm<IntakeFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(intakeSchema),
  })

  const { append, fields, remove } = useFieldArray({
    control,
    name: 'lineItems',
    keyName: 'fieldKey',
  })

  const watchedLineItems = watch('lineItems')
  const watchedTaxRate = watch('taxRate')
  const watchedDiscount = watch('discount')

  const liveTotals = useMemo(
    () => calculateTotals(watchedLineItems ?? [], watchedTaxRate ?? 0, watchedDiscount ?? 0),
    [watchedDiscount, watchedLineItems, watchedTaxRate],
  )

  const loadConversion = useCallback(
    async (forceRefresh = false) => {
      if (!shouldShowConversion) {
        setConversionState({ kind: 'idle' })
        return
      }

      setConversionState({ kind: 'loading' })

      try {
        const { asOf, rate } = await getRate(baseCurrency, clientCurrency, {
          forceRefresh,
        })

        setConversionState({
          kind: 'ready',
          asOf,
          rate,
          convertedTotal: roundCurrency(liveTotals.total * rate),
        })
      } catch (error) {
        setConversionState({
          kind: 'error',
          message: getErrorMessage(error),
        })
      }
    },
    [baseCurrency, clientCurrency, liveTotals.total, shouldShowConversion],
  )

  useEffect(() => {
    if (activeStep !== 3) {
      return
    }

    void loadConversion()
  }, [activeStep, loadConversion])

  const isLastStep = activeStep === steps.length - 1

  async function handleNextStep() {
    const isValid = await trigger(stepFields[activeStep], { shouldFocus: true })
    if (isValid) {
      setActiveStep((step) => Math.min(step + 1, steps.length - 1))
    }
  }

  function handleBackStep() {
    setActiveStep((step) => Math.max(step - 1, 0))
  }

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null)

    try {
      const now = new Date().toISOString()
      const lineItems = values.lineItems.map((item) => ({
        id: buildId('line-item'),
        description: item.description.trim(),
        qty: item.qty,
        unitPrice: item.unitPrice,
      }))

      const quote: Quote = {
        id: buildId('quote'),
        client: {
          name: values.client.name.trim(),
          email: values.client.email.trim(),
          company: values.client.company?.trim() || undefined,
        },
        scope: {
          projectType: values.scope.projectType,
          description: values.scope.description.trim(),
          desiredStartDate: values.scope.desiredStartDate,
        },
        currency: baseCurrency,
        lineItems,
        taxRate: values.taxRate,
        discountRate: values.discount,
        totals: calculateTotals(lineItems, values.taxRate, values.discount),
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      }

      const savedQuote = saveQuote(quote)
      navigate(`/quote/${savedQuote.id}`)
    } catch {
      setSubmitError('Unable to create the quote right now. Please try again.')
    }
  })

  return (
    <section className="page">
      <header className="page__header">
        <h1>Intake Wizard</h1>
        <p>Create a quote in four guided steps with editable line items and live totals.</p>
      </header>

      <Card
        title="Quote Intake"
        description={`Step ${activeStep + 1} of ${steps.length}: ${steps[activeStep].title}`}
      >
        <ol className="wizard-steps" aria-label="Intake wizard progress">
          {steps.map((step, index) => (
            <li
              className={`wizard-steps__item${index === activeStep ? ' wizard-steps__item--active' : ''}`}
              key={step.title}
            >
              <span className="wizard-steps__index" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <p className="wizard-steps__title">{step.title}</p>
                <p className="wizard-steps__description">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <form className="form" onSubmit={onSubmit}>
          {activeStep === 0 ? (
            <div className="grid grid--2">
              <Input
                label="Client Name"
                placeholder="Jordan Lee"
                error={errors.client?.name?.message}
                {...register('client.name')}
              />
              <Input
                label="Client Email"
                placeholder="jordan@example.com"
                type="email"
                error={errors.client?.email?.message}
                {...register('client.email')}
              />
              <Input
                label="Company (optional)"
                placeholder="Acme Studio"
                error={errors.client?.company?.message}
                {...register('client.company')}
              />
            </div>
          ) : null}

          {activeStep === 1 ? (
            <>
              <div className="grid grid--2">
                <Select
                  label="Project Type"
                  error={errors.scope?.projectType?.message}
                  {...register('scope.projectType')}
                >
                  <option value="website">Website</option>
                  <option value="mobile-app">Mobile App</option>
                  <option value="branding">Branding</option>
                  <option value="marketing">Marketing Campaign</option>
                  <option value="other">Other</option>
                </Select>
                <Input
                  label="Desired Start Date"
                  type="date"
                  error={errors.scope?.desiredStartDate?.message}
                  {...register('scope.desiredStartDate')}
                />
              </div>
              <Textarea
                label="Scope Description"
                placeholder="Describe goals, deliverables, and constraints..."
                rows={5}
                error={errors.scope?.description?.message}
                {...register('scope.description')}
              />
            </>
          ) : null}

          {activeStep === 2 ? (
            <>
              {errors.lineItems?.message ? (
                <p className="field-error">{errors.lineItems.message}</p>
              ) : null}

              <div className="stack">
                {fields.map((field, index) => (
                  <Card key={field.fieldKey} className="card--inset" title={`Line Item ${index + 1}`}>
                    <div className="grid grid--3">
                      <Input
                        label="Description"
                        placeholder="Discovery workshop"
                        error={errors.lineItems?.[index]?.description?.message}
                        {...register(`lineItems.${index}.description`)}
                      />
                      <Input
                        label="Qty"
                        type="number"
                        min={1}
                        step={1}
                        error={errors.lineItems?.[index]?.qty?.message}
                        {...register(`lineItems.${index}.qty`, { valueAsNumber: true })}
                      />
                      <Input
                        label="Unit Price"
                        type="number"
                        min={0}
                        step={0.01}
                        error={errors.lineItems?.[index]?.unitPrice?.message}
                        {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="line-item__actions">
                      <Button
                        variant="ghost"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1 || isSubmitting}
                      >
                        Remove Item
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                variant="ghost"
                onClick={() => append({ description: '', qty: 1, unitPrice: 0 })}
                disabled={isSubmitting}
              >
                Add Line Item
              </Button>

              <Card className="card--inset" title={`Live Totals Preview (${baseCurrency})`}>
                <TotalsBreakdown
                  subtotalLabel="Current Subtotal"
                  totals={liveTotals}
                  currency={baseCurrency}
                />
              </Card>
            </>
          ) : null}

          {activeStep === 3 ? (
            <>
              <div className="grid grid--2">
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  min={0}
                  max={15}
                  step={0.25}
                  error={errors.taxRate?.message}
                  {...register('taxRate', { valueAsNumber: true })}
                />
                <Input
                  label="Discount (%)"
                  type="number"
                  min={0}
                  max={30}
                  step={0.25}
                  error={errors.discount?.message}
                  {...register('discount', { valueAsNumber: true })}
                />
              </div>

              <div className="grid grid--2">
                <Card className="card--inset" title="Client Summary">
                  <p>
                    <strong>{watch('client.name') || 'Client name pending'}</strong>
                  </p>
                  <p className="muted">{watch('client.email') || 'Client email pending'}</p>
                  {watch('client.company') ? (
                    <p className="muted">{watch('client.company')}</p>
                  ) : null}
                </Card>
                <Card className="card--inset" title="Scope Summary">
                  <p>
                    <Badge variant="neutral">{getProjectTypeLabel(watch('scope.projectType'))}</Badge>
                  </p>
                  <p className="muted">{watch('scope.desiredStartDate') || 'Date not set'}</p>
                  <p>{watch('scope.description') || 'Scope description pending.'}</p>
                </Card>
              </div>

              <Card className="card--inset" title={`Final Totals (${baseCurrency})`}>
                <TotalsBreakdown subtotalLabel="Subtotal" totals={liveTotals} currency={baseCurrency} />

                {shouldShowConversion ? (
                  <div className="fx-preview">
                    <p className="muted">Client currency preview: {clientCurrency}</p>

                    {conversionState.kind === 'loading' ? (
                      <p className="muted">Fetching rate...</p>
                    ) : null}

                    {conversionState.kind === 'ready' ? (
                      <>
                        <p>
                          Converted total:{' '}
                          <strong>{formatCurrency(conversionState.convertedTotal, clientCurrency)}</strong>
                        </p>
                        <p className="muted">
                          1 {baseCurrency} = {conversionState.rate.toFixed(4)} {clientCurrency} as of{' '}
                          {conversionState.asOf}
                        </p>
                      </>
                    ) : null}

                    {conversionState.kind === 'error' ? (
                      <div className="fx-preview__error">
                        <p className="field-error">Conversion unavailable.</p>
                        <Button
                          variant="ghost"
                          onClick={() => void loadConversion(true)}
                          disabled={isSubmitting}
                        >
                          Retry
                        </Button>
                        <p className="muted">{conversionState.message}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            </>
          ) : null}

          <div className="wizard-actions">
            <Button variant="ghost" onClick={handleBackStep} disabled={activeStep === 0 || isSubmitting}>
              Back
            </Button>
            {!isLastStep ? (
              <Button onClick={handleNextStep} disabled={isSubmitting}>
                Next Step
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Quote...' : 'Create Quote'}
              </Button>
            )}
          </div>
        </form>
      </Card>

      {submitError ? (
        <Card className="placeholder-card" title="Unable to Create Quote" description={submitError} />
      ) : null}
    </section>
  )
}

interface TotalsBreakdownProps {
  subtotalLabel: string
  totals: {
    subtotal: number
    tax: number
    discount: number
    total: number
  }
  currency: CurrencyCode
}

function TotalsBreakdown({ subtotalLabel, totals, currency }: TotalsBreakdownProps) {
  return (
    <div className="totals">
      <p>
        <span>{subtotalLabel}</span>
        <strong>{formatCurrency(totals.subtotal, currency)}</strong>
      </p>
      <p>
        <span>Tax</span>
        <strong>{formatCurrency(totals.tax, currency)}</strong>
      </p>
      <p>
        <span>Discount</span>
        <strong>-{formatCurrency(totals.discount, currency)}</strong>
      </p>
      <p>
        <span>Total</span>
        <strong>{formatCurrency(totals.total, currency)}</strong>
      </p>
    </div>
  )
}

function getProjectTypeLabel(projectType: ProjectType) {
  switch (projectType) {
    case 'mobile-app':
      return 'Mobile App'
    case 'branding':
      return 'Branding'
    case 'marketing':
      return 'Marketing'
    case 'other':
      return 'Other'
    case 'website':
    default:
      return 'Website'
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Conversion unavailable right now. Please try again.'
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function buildId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`
}
