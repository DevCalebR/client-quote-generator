import type {
  ClientInfo,
  CurrencyCode,
  LineItem,
  ProjectType,
  Quote,
  QuoteStatus,
  QuoteTotals,
} from './types'

const STORAGE_KEY = 'client-quote-generator:quotes:v2'

export function listQuotes(): Quote[] {
  return readQuotes().sort((left, right) => {
    const leftDate = Date.parse(left.updatedAt)
    const rightDate = Date.parse(right.updatedAt)
    return rightDate - leftDate
  })
}

export function getQuote(id: string): Quote | undefined {
  return readQuotes().find((quote) => quote.id === id)
}

export function saveQuote(quote: Quote): Quote {
  if (!isQuote(quote)) {
    throw new Error('Invalid quote payload')
  }

  const persistedQuote: Quote = {
    ...quote,
    updatedAt: new Date().toISOString(),
  }

  const quotes = readQuotes()
  const existingIndex = quotes.findIndex((item) => item.id === persistedQuote.id)

  if (existingIndex >= 0) {
    quotes[existingIndex] = persistedQuote
  } else {
    quotes.push(persistedQuote)
  }

  writeQuotes(quotes)
  return persistedQuote
}

export function deleteQuote(id: string): boolean {
  const quotes = readQuotes()
  const nextQuotes = quotes.filter((quote) => quote.id !== id)

  if (nextQuotes.length === quotes.length) {
    return false
  }

  writeQuotes(nextQuotes)
  return true
}

function readQuotes(): Quote[] {
  if (!isBrowser()) {
    return []
  }

  const serialized = window.localStorage.getItem(STORAGE_KEY)
  if (!serialized) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isQuote)
  } catch {
    return []
  }
}

function writeQuotes(quotes: Quote[]) {
  if (!isBrowser()) {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
  } catch {
    // Ignore write failures to avoid crashing UI in private mode/quota issues.
  }
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function isQuote(value: unknown): value is Quote {
  if (!isRecord(value)) {
    return false
  }

  return (
    isString(value.id) &&
    isClientInfo(value.client) &&
    isScope(value.scope) &&
    isCurrencyCode(value.currency) &&
    Array.isArray(value.lineItems) &&
    value.lineItems.every(isLineItem) &&
    isNumber(value.taxRate) &&
    isNumber(value.discountRate) &&
    isQuoteTotals(value.totals) &&
    isQuoteStatus(value.status) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  )
}

function isClientInfo(value: unknown): value is ClientInfo {
  if (!isRecord(value)) {
    return false
  }

  return (
    isString(value.name) &&
    isString(value.email) &&
    (value.company === undefined || isString(value.company))
  )
}

function isScope(value: unknown): value is Quote['scope'] {
  if (!isRecord(value)) {
    return false
  }

  return (
    isProjectType(value.projectType) &&
    isString(value.description) &&
    isString(value.desiredStartDate)
  )
}

function isLineItem(value: unknown): value is LineItem {
  if (!isRecord(value)) {
    return false
  }

  return (
    isString(value.id) &&
    isString(value.description) &&
    isNumber(value.qty) &&
    isNumber(value.unitPrice)
  )
}

function isQuoteTotals(value: unknown): value is QuoteTotals {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNumber(value.subtotal) &&
    isNumber(value.tax) &&
    isNumber(value.discount) &&
    isNumber(value.total)
  )
}

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === 'USD' || value === 'EUR' || value === 'GBP'
}

function isQuoteStatus(value: unknown): value is QuoteStatus {
  return value === 'draft' || value === 'sent' || value === 'accepted' || value === 'declined'
}

function isProjectType(value: unknown): value is ProjectType {
  return (
    value === 'website' ||
    value === 'mobile-app' ||
    value === 'branding' ||
    value === 'marketing' ||
    value === 'other'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
