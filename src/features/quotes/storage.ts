import type { NewQuoteInput, Quote } from './types'

const STORAGE_KEY = 'client-quote-generator:quotes:v1'

export function getQuotes(): Quote[] {
  const quotes = readRawQuotes()
  return quotes.sort((left, right) =>
    left.createdAt < right.createdAt ? 1 : left.createdAt > right.createdAt ? -1 : 0,
  )
}

export function getQuoteById(quoteId: string): Quote | undefined {
  return readRawQuotes().find((quote) => quote.id === quoteId)
}

export function createQuote(input: NewQuoteInput): Quote {
  const timestamp = new Date().toISOString()
  const quote: Quote = {
    ...input,
    createdAt: timestamp,
    id: createId(),
    updatedAt: timestamp,
  }

  const quotes = readRawQuotes()
  quotes.push(quote)
  writeRawQuotes(quotes)
  return quote
}

export function deleteQuote(quoteId: string): boolean {
  const quotes = readRawQuotes()
  const filteredQuotes = quotes.filter((quote) => quote.id !== quoteId)

  if (filteredQuotes.length === quotes.length) {
    return false
  }

  writeRawQuotes(filteredQuotes)
  return true
}

function readRawQuotes(): Quote[] {
  if (!isBrowser()) {
    return []
  }

  const serialized = window.localStorage.getItem(STORAGE_KEY)
  if (!serialized) {
    return []
  }

  try {
    const parsedValue: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue as Quote[]
  } catch {
    return []
  }
}

function writeRawQuotes(quotes: Quote[]) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `quote-${Date.now()}`
}

function isBrowser() {
  return typeof window !== 'undefined'
}
