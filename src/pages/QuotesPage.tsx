import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { deleteQuote, getQuotes } from '../features/quotes/storage'
import type { Quote } from '../features/quotes/types'
import { formatCurrency, formatDate, formatQuoteCode, getStatusVariant } from '../lib/format'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; quotes: Quote[] }

export function QuotesPage() {
  const [loadState, setLoadState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    hydrateQuotes()
  }, [])

  function hydrateQuotes() {
    setLoadState({ kind: 'loading' })

    try {
      const quotes = getQuotes()
      setLoadState({ kind: 'ready', quotes })
    } catch {
      setLoadState({ kind: 'error' })
    }
  }

  function handleDelete(quoteId: string) {
    deleteQuote(quoteId)
    hydrateQuotes()
  }

  return (
    <section className="page">
      <header className="page__header page__header--row">
        <div>
          <h1>Quotes</h1>
          <p>All quote drafts saved in local storage.</p>
        </div>
        <Button onClick={hydrateQuotes} variant="ghost">
          Refresh
        </Button>
      </header>

      {loadState.kind === 'loading' ? (
        <Card
          className="placeholder-card"
          title="Loading Quotes"
          description="Fetching quotes from local storage..."
        />
      ) : null}

      {loadState.kind === 'error' ? (
        <Card
          className="placeholder-card"
          title="Unable to Load Quotes"
          description="Something went wrong while reading local quote data."
          footer={<Button onClick={hydrateQuotes}>Try again</Button>}
        />
      ) : null}

      {loadState.kind === 'ready' && loadState.quotes.length === 0 ? (
        <Card
          className="placeholder-card"
          title="No Quotes Yet"
          description="Create your first quote from the intake page."
          footer={
            <Link className="inline-link" to="/intake">
              Go to intake form
            </Link>
          }
        />
      ) : null}

      {loadState.kind === 'ready' && loadState.quotes.length > 0 ? (
        <div className="stack">
          {loadState.quotes.map((quote) => (
            <Card
              key={quote.id}
              title={`${quote.clientName} - ${quote.projectName}`}
              description={`Created ${formatDate(quote.createdAt)}`}
              footer={
                <div className="row-actions">
                  <Link className="inline-link" to={`/quote/${quote.id}`}>
                    View details
                  </Link>
                  <Button onClick={() => handleDelete(quote.id)} variant="danger">
                    Delete
                  </Button>
                </div>
              }
            >
              <div className="quote-meta">
                <p>
                  <strong>{formatQuoteCode(quote.id)}</strong>
                </p>
                <p>
                  <Badge variant={getStatusVariant(quote.status)}>{quote.status}</Badge>
                </p>
                <p>{formatCurrency(quote.totals.total, quote.currency)}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  )
}
