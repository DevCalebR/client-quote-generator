import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { createQuote } from '../features/quotes/storage'
import type { NewQuoteInput } from '../features/quotes/types'
import { formatCurrency } from '../lib/format'

const intakeSchema = z.object({
  clientName: z.string().min(2, 'Client name must be at least 2 characters.'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  lineItemDescription: z
    .string()
    .min(2, 'Line item description must be at least 2 characters.'),
  notes: z.string().max(1000, 'Notes must be under 1000 characters.').optional(),
  projectName: z.string().min(2, 'Project name must be at least 2 characters.'),
  quantity: z
    .number()
    .int('Quantity must be a whole number.')
    .min(1, 'Quantity must be 1 or greater.'),
  taxRate: z
    .number()
    .min(0, 'Tax rate must be between 0 and 100.')
    .max(100, 'Tax rate must be between 0 and 100.'),
  unitPrice: z.number().min(0, 'Unit price must be 0 or greater.'),
})

type IntakeFormValues = z.infer<typeof intakeSchema>

const defaultValues: IntakeFormValues = {
  clientName: '',
  currency: 'USD',
  lineItemDescription: '',
  notes: '',
  projectName: '',
  quantity: 1,
  taxRate: 0,
  unitPrice: 0,
}

export function IntakePage() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<IntakeFormValues>({
    defaultValues,
    resolver: zodResolver(intakeSchema),
  })

  const watchedQuantity = watch('quantity')
  const watchedUnitPrice = watch('unitPrice')
  const watchedCurrency = watch('currency')
  const quantityValue = Number(watchedQuantity)
  const priceValue = Number(watchedUnitPrice)
  const livePreviewTotal = Number.isFinite(quantityValue * priceValue)
    ? quantityValue * priceValue
    : 0

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null)

    try {
      const quoteInput = buildQuoteInput(values)
      const quote = createQuote(quoteInput)
      navigate(`/quote/${quote.id}`)
    } catch {
      setSubmitError('Unable to save quote. Try again.')
    }
  })

  return (
    <section className="page">
      <header className="page__header">
        <h1>Client Intake</h1>
        <p>Create a draft quote from one starter line item.</p>
      </header>

      <Card
        title="Intake Form"
        description="This starter form captures one line item and computes totals for local quote storage."
      >
        <form className="form" onSubmit={onSubmit}>
          <div className="grid grid--2">
            <Input
              label="Client Name"
              placeholder="Acme Corp"
              error={errors.clientName?.message}
              {...register('clientName')}
            />
            <Input
              label="Project Name"
              placeholder="Website Redesign"
              error={errors.projectName?.message}
              {...register('projectName')}
            />
          </div>

          <div className="grid grid--3">
            <Select label="Currency" error={errors.currency?.message} {...register('currency')}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </Select>
            <Input
              label="Quantity"
              type="number"
              min={1}
              step={1}
              error={errors.quantity?.message}
              {...register('quantity', { valueAsNumber: true })}
            />
            <Input
              label="Unit Price"
              type="number"
              min={0}
              step={0.01}
              error={errors.unitPrice?.message}
              {...register('unitPrice', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid--2">
            <Input
              label="Line Item Description"
              placeholder="Discovery + planning"
              error={errors.lineItemDescription?.message}
              {...register('lineItemDescription')}
            />
            <Input
              label="Tax Rate (%)"
              type="number"
              min={0}
              max={100}
              step={0.1}
              error={errors.taxRate?.message}
              {...register('taxRate', { valueAsNumber: true })}
            />
          </div>

          <Textarea
            label="Notes"
            rows={4}
            placeholder="Timeline, assumptions, or additional context..."
            error={errors.notes?.message}
            {...register('notes')}
          />

          <Card
            className="card--inset"
            title="Live Preview"
            description={`Line subtotal: ${formatCurrency(livePreviewTotal, watchedCurrency)}`}
          />

          <div className="form__actions">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving quote...' : 'Create quote'}
            </Button>
          </div>
        </form>
      </Card>

      {submitError ? (
        <Card className="placeholder-card" title="Save Error" description={submitError} />
      ) : null}
    </section>
  )
}

function buildQuoteInput(values: IntakeFormValues): NewQuoteInput {
  const subtotal = values.quantity * values.unitPrice
  const taxAmount = subtotal * (values.taxRate / 100)
  const total = subtotal + taxAmount

  return {
    clientName: values.clientName.trim(),
    currency: values.currency,
    lineItems: [
      {
        description: values.lineItemDescription.trim(),
        id: buildLineItemId(),
        quantity: values.quantity,
        total: subtotal,
        unitPrice: values.unitPrice,
      },
    ],
    notes: values.notes?.trim() || undefined,
    projectName: values.projectName.trim(),
    status: 'draft',
    totals: {
      subtotal,
      taxAmount,
      taxRate: values.taxRate,
      total,
    },
  }
}

function buildLineItemId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `line-item-${Date.now()}`
}
