import type { CurrencyCode, QuoteStatus } from '../features/quotes/types'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatCurrency(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat('en-US', {
    currency,
    style: 'currency',
  }).format(amount)
}

export function formatDate(isoDate: string) {
  return dateFormatter.format(new Date(isoDate))
}

export function formatQuoteCode(quoteId: string) {
  return quoteId.length >= 8 ? `Q-${quoteId.slice(0, 8).toUpperCase()}` : quoteId
}

export function getStatusVariant(status: QuoteStatus) {
  switch (status) {
    case 'accepted':
      return 'success'
    case 'declined':
      return 'danger'
    case 'sent':
      return 'warning'
    case 'draft':
    default:
      return 'neutral'
  }
}
