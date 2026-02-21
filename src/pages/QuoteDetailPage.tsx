import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { getQuoteById } from '../features/quotes/storage'
import type { Quote } from '../features/quotes/types'
import { formatCurrency, formatDate, formatQuoteCode, getStatusVariant } from '../lib/format'

type DetailState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'missing' }
  | { kind: 'ready'; quote: Quote }

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [detailState, setDetailState] = useState<DetailState>({ kind: 'loading' })

  useEffect(() => {
    if (!id) {
      setDetailState({ kind: 'error' })
      return
    }

    setDetailState({ kind: 'loading' })

    try {
      const quote = getQuoteById(id)
      if (!quote) {
        setDetailState({ kind: 'missing' })
        return
      }

      setDetailState({ kind: 'ready', quote })
    } catch {
      setDetailState({ kind: 'error' })
    }
  }, [id])

  return (
    <section className="page">
      <header className="page__header page__header--row">
        <div>
          <h1>Quote Detail</h1>
          <p>Inspect saved quote metadata and line items.</p>
        </div>
        <Link className="inline-link" to="/quotes">
          Back to quotes
        </Link>
      </header>

      {detailState.kind === 'loading' ? (
        <Card
          className="placeholder-card"
          title="Loading Quote"
          description="Fetching quote details..."
        />
      ) : null}

      {detailState.kind === 'error' ? (
        <Card
          className="placeholder-card"
          title="Unable to Load Quote"
          description="An unexpected error occurred while reading the quote."
          footer={
            <Link to="/quotes">
              <Button>Return to list</Button>
            </Link>
          }
        />
      ) : null}

      {detailState.kind === 'missing' ? (
        <Card
          className="placeholder-card"
          title="Quote Not Found"
          description="This quote ID does not exist in local storage."
          footer={
            <Link className="inline-link" to="/quotes">
              Browse existing quotes
            </Link>
          }
        />
      ) : null}

      {detailState.kind === 'ready' ? (
        <>
          <Card
            title={`${detailState.quote.clientName} - ${detailState.quote.projectName}`}
            description={`Created ${formatDate(detailState.quote.createdAt)} · ${formatQuoteCode(detailState.quote.id)}`}
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
                <strong>Currency</strong>
                <br />
                {detailState.quote.currency}
              </p>
              <p>
                <strong>Total</strong>
                <br />
                {formatCurrency(
                  detailState.quote.totals.total,
                  detailState.quote.currency,
                )}
              </p>
            </div>
            {detailState.quote.notes ? (
              <p className="muted">Notes: {detailState.quote.notes}</p>
            ) : null}
          </Card>

          <Card title="Line Items" description="Starter quote supports one or more line items.">
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
                      <td>{lineItem.quantity}</td>
                      <td>
                        {formatCurrency(
                          lineItem.unitPrice,
                          detailState.quote.currency,
                        )}
                      </td>
                      <td>
                        {formatCurrency(lineItem.total, detailState.quote.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="totals">
              <p>
                <span>Subtotal</span>
                <strong>
                  {formatCurrency(
                    detailState.quote.totals.subtotal,
                    detailState.quote.currency,
                  )}
                </strong>
              </p>
              <p>
                <span>Tax ({detailState.quote.totals.taxRate}%)</span>
                <strong>
                  {formatCurrency(
                    detailState.quote.totals.taxAmount,
                    detailState.quote.currency,
                  )}
                </strong>
              </p>
              <p>
                <span>Total</span>
                <strong>
                  {formatCurrency(
                    detailState.quote.totals.total,
                    detailState.quote.currency,
                  )}
                </strong>
              </p>
            </div>
          </Card>
        </>
      ) : null}
    </section>
  )
}
