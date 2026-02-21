import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { getRate } from '../features/fx/rates'
import { deleteQuote, getQuote, saveQuote } from '../features/quotes/storage'
import type { Quote } from '../features/quotes/types'
import { getSettings } from '../features/settings/storage'
import { formatCurrency, formatDate, formatQuoteCode, getStatusVariant } from '../lib/format'

type DetailState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'missing' }
  | { kind: 'ready'; quote: Quote }

type ConversionState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; asOf: string; convertedTotal: number; rate: number }
  | { kind: 'error'; message: string }

export function QuoteDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [settings] = useState(() => getSettings())

  const [detailState, setDetailState] = useState<DetailState>({ kind: 'loading' })
  const [conversionState, setConversionState] = useState<ConversionState>({ kind: 'idle' })
  const [actionError, setActionError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  useEffect(() => {
    if (!id) {
      setDetailState({ kind: 'error' })
      return
    }

    setDetailState({ kind: 'loading' })

    try {
      const quote = getQuote(id)
      if (!quote) {
        setDetailState({ kind: 'missing' })
        return
      }

      setDetailState({ kind: 'ready', quote })
    } catch {
      setDetailState({ kind: 'error' })
    }
  }, [id])

  useEffect(() => {
    if (detailState.kind !== 'ready') {
      setConversionState({ kind: 'idle' })
      return
    }

    if (detailState.quote.currency === settings.clientCurrency) {
      setConversionState({ kind: 'idle' })
      return
    }

    void fetchConversion(detailState.quote)
  }, [detailState, settings.clientCurrency])

  async function fetchConversion(quote: Quote, forceRefresh = false) {
    setConversionState({ kind: 'loading' })

    try {
      const { asOf, rate } = await getRate(quote.currency, settings.clientCurrency, {
        forceRefresh,
      })

      setConversionState({
        kind: 'ready',
        asOf,
        rate,
        convertedTotal: roundCurrency(quote.totals.total * rate),
      })
    } catch (error) {
      setConversionState({
        kind: 'error',
        message: getErrorMessage(error),
      })
    }
  }

  function handleDuplicate() {
    if (detailState.kind !== 'ready') {
      return
    }

    setActionError(null)
    setIsDuplicating(true)

    try {
      const now = new Date().toISOString()
      const duplicated: Quote = {
        ...detailState.quote,
        id: buildId('quote'),
        lineItems: detailState.quote.lineItems.map((lineItem) => ({
          ...lineItem,
          id: buildId('line-item'),
        })),
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      }

      const savedQuote = saveQuote(duplicated)
      navigate(`/quote/${savedQuote.id}`)
    } catch {
      setActionError('Could not duplicate this quote. Please try again.')
    } finally {
      setIsDuplicating(false)
    }
  }

  function handleDelete() {
    if (!id || detailState.kind !== 'ready') {
      return
    }

    const confirmed = window.confirm('Delete this quote? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    setActionError(null)
    setIsDeleting(true)

    try {
      const deleted = deleteQuote(id)
      if (!deleted) {
        setActionError('This quote no longer exists.')
        return
      }

      navigate('/quotes')
    } catch {
      setActionError('Could not delete this quote. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const shouldShowConversion =
    detailState.kind === 'ready' && detailState.quote.currency !== settings.clientCurrency

  return (
    <section className="page">
      <header className="page__header page__header--row">
        <div>
          <h1>Quote Detail</h1>
          <p>Review quote details, totals, and metadata.</p>
        </div>
        <div className="row-actions">
          <Link className="inline-link" to="/quotes">
            Back to Quotes
          </Link>
          <Button variant="ghost" onClick={handleDuplicate} disabled={isDuplicating || isDeleting}>
            {isDuplicating ? 'Duplicating...' : 'Duplicate Quote'}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting || isDuplicating}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </header>

      {detailState.kind === 'loading' ? (
        <Card className="placeholder-card" title="Loading Quote" description="Fetching quote details..." />
      ) : null}

      {detailState.kind === 'error' ? (
        <Card
          className="placeholder-card"
          title="Unable to Load Quote"
          description="An unexpected error occurred while loading this quote."
          footer={
            <Link className="inline-link" to="/quotes">
              Return to quote list
            </Link>
          }
        />
      ) : null}

      {detailState.kind === 'missing' ? (
        <Card
          className="placeholder-card"
          title="Quote Not Found"
          description="The quote ID in this URL does not exist."
          footer={
            <Link className="inline-link" to="/quotes">
              Browse saved quotes
            </Link>
          }
        />
      ) : null}

      {actionError ? (
        <Card className="placeholder-card" title="Action Error" description={actionError} />
      ) : null}

      {detailState.kind === 'ready' ? (
        <>
          <Card
            title={detailState.quote.client.company
              ? `${detailState.quote.client.name} · ${detailState.quote.client.company}`
              : detailState.quote.client.name}
            description={`${formatQuoteCode(detailState.quote.id)} · Created ${formatDate(detailState.quote.createdAt)}`}
          >
            <div className="grid grid--3">
              <p>
                <strong>Status</strong>
                <br />
                <Badge variant={getStatusVariant(detailState.quote.status)}>
                  {detailState.quote.status}
                </Badge>
              </p>
              <p>
                <strong>Updated</strong>
                <br />
                {formatDate(detailState.quote.updatedAt)}
              </p>
              <p>
                <strong>Client Email</strong>
                <br />
                {detailState.quote.client.email}
              </p>
            </div>
          </Card>

          <Card title="Project Scope" description="Scope captured from the intake wizard.">
            <div className="grid grid--2">
              <p>
                <strong>Project Type</strong>
                <br />
                {getProjectTypeLabel(detailState.quote.scope.projectType)}
              </p>
              <p>
                <strong>Desired Start Date</strong>
                <br />
                {detailState.quote.scope.desiredStartDate}
              </p>
            </div>
            <p className="muted">{detailState.quote.scope.description}</p>
          </Card>

          <Card title="Line Items">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailState.quote.lineItems.map((lineItem) => (
                    <tr key={lineItem.id}>
                      <td>{lineItem.description}</td>
                      <td>{lineItem.qty}</td>
                      <td>{formatCurrency(lineItem.unitPrice, detailState.quote.currency)}</td>
                      <td>{formatCurrency(lineItem.qty * lineItem.unitPrice, detailState.quote.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="totals">
              <p>
                <span>Subtotal</span>
                <strong>{formatCurrency(detailState.quote.totals.subtotal, detailState.quote.currency)}</strong>
              </p>
              <p>
                <span>Tax ({detailState.quote.taxRate}%)</span>
                <strong>{formatCurrency(detailState.quote.totals.tax, detailState.quote.currency)}</strong>
              </p>
              <p>
                <span>Discount ({detailState.quote.discountRate}%)</span>
                <strong>-{formatCurrency(detailState.quote.totals.discount, detailState.quote.currency)}</strong>
              </p>
              <p>
                <span>Total</span>
                <strong>{formatCurrency(detailState.quote.totals.total, detailState.quote.currency)}</strong>
              </p>
            </div>

            {shouldShowConversion ? (
              <div className="fx-preview">
                {conversionState.kind === 'loading' ? <p className="muted">Fetching rate...</p> : null}

                {conversionState.kind === 'ready' ? (
                  <>
                    <p>
                      Converted total:{' '}
                      <strong>{formatCurrency(conversionState.convertedTotal, settings.clientCurrency)}</strong>
                    </p>
                    <p className="muted">
                      1 {detailState.quote.currency} = {conversionState.rate.toFixed(4)}{' '}
                      {settings.clientCurrency} as of {conversionState.asOf}
                    </p>
                  </>
                ) : null}

                {conversionState.kind === 'error' ? (
                  <div className="fx-preview__error">
                    <p className="field-error">Conversion unavailable.</p>
                    <Button
                      variant="ghost"
                      onClick={() => void fetchConversion(detailState.quote, true)}
                      disabled={isDeleting || isDuplicating}
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
    </section>
  )
}

function getProjectTypeLabel(projectType: Quote['scope']['projectType']) {
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
