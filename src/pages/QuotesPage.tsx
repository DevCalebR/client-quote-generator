import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { listQuotes } from '../features/quotes/storage'
import type { Quote, QuoteStatus } from '../features/quotes/types'
import { formatCurrency, formatDate, formatQuoteCode, getStatusVariant } from '../lib/format'

type QuotesState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; quotes: Quote[] }

type StatusFilter = QuoteStatus | 'all'

export function QuotesPage() {
  const [quotesState, setQuotesState] = useState<QuotesState>({ kind: 'loading' })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    hydrateQuotes()
  }, [])

  const filteredQuotes = useMemo(() => {
    if (quotesState.kind !== 'ready') {
      return []
    }

    const normalizedQuery = searchQuery.trim().toLowerCase()

    return quotesState.quotes.filter((quote) => {
      const clientName = quote.client.name.toLowerCase()
      const company = quote.client.company?.toLowerCase() ?? ''
      const matchesQuery =
        normalizedQuery.length === 0 ||
        clientName.includes(normalizedQuery) ||
        company.includes(normalizedQuery)
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [quotesState, searchQuery, statusFilter])

  function hydrateQuotes() {
    setQuotesState({ kind: 'loading' })

    try {
      const quotes = listQuotes()
      setQuotesState({ kind: 'ready', quotes })
    } catch {
      setQuotesState({ kind: 'error' })
    }
  }

  function clearFilters() {
    setSearchQuery('')
    setStatusFilter('all')
  }

  return (
    <section className="page">
      <header className="page__header page__header--row">
        <div>
          <h1>Quotes</h1>
          <p>Search and review all saved quotes in local storage.</p>
        </div>
        <Button onClick={hydrateQuotes} variant="ghost">
          Refresh
        </Button>
      </header>

      {quotesState.kind === 'loading' ? (
        <Card
          className="placeholder-card"
          title="Loading Quotes"
          description="Reading quote data from local storage..."
        />
      ) : null}

      {quotesState.kind === 'error' ? (
        <Card
          className="placeholder-card"
          title="Unable to Load Quotes"
          description="Something went wrong while loading your saved quotes."
          footer={<Button onClick={hydrateQuotes}>Try Again</Button>}
        />
      ) : null}

      {quotesState.kind === 'ready' ? (
        <>
          <Card className="card--inset" title="Filters">
            <div className="grid grid--2">
              <Input
                label="Search by client/company"
                placeholder="Type a client name..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <Select
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </Select>
            </div>
          </Card>

          {quotesState.quotes.length === 0 ? (
            <Card
              className="placeholder-card"
              title="No Quotes Yet"
              description="Start your first quote in the intake wizard."
              footer={
                <Link className="inline-link" to="/intake">
                  Create a quote
                </Link>
              }
            />
          ) : null}

          {quotesState.quotes.length > 0 && filteredQuotes.length === 0 ? (
            <Card
              className="placeholder-card"
              title="No Matching Results"
              description="No quotes match the current search/filter settings."
              footer={
                <Button variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : null}

          {filteredQuotes.length > 0 ? (
            <div className="stack">
              {filteredQuotes.map((quote) => (
                <Card
                  key={quote.id}
                  title={quote.client.company ? `${quote.client.name} · ${quote.client.company}` : quote.client.name}
                  description={`Updated ${formatDate(quote.updatedAt)} · ${formatQuoteCode(quote.id)}`}
                  footer={
                    <Link className="inline-link" to={`/quote/${quote.id}`}>
                      View quote
                    </Link>
                  }
                >
                  <div className="quote-meta">
                    <p>
                      <Badge variant={getStatusVariant(quote.status)}>{quote.status}</Badge>
                    </p>
                    <p>{getProjectTypeLabel(quote.scope.projectType)}</p>
                    <p>{formatCurrency(quote.totals.total, quote.currency)}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
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
