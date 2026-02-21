import type { CurrencyCode } from '../quotes/types'

const FX_STORAGE_KEY = 'client-quote-generator:fx-rates:v1'
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000

const inMemoryRateCache = new Map<string, StoredRateEntry>()

interface StoredRateEntry {
  rate: number
  asOf: string
  expiresAt: number
}

interface RateResponse {
  rate: number
  asOf: string
}

export interface GetRateOptions {
  forceRefresh?: boolean
}

export async function getRate(
  base: CurrencyCode,
  quote: CurrencyCode,
  options: GetRateOptions = {},
): Promise<RateResponse> {
  if (base === quote) {
    return { rate: 1, asOf: new Date().toISOString() }
  }

  const cacheKey = buildCacheKey(base, quote)
  if (!options.forceRefresh) {
    const memoryEntry = inMemoryRateCache.get(cacheKey)
    if (isFresh(memoryEntry)) {
      return { rate: memoryEntry.rate, asOf: memoryEntry.asOf }
    }

    const localStorageEntry = readLocalStorageEntry(cacheKey)
    if (isFresh(localStorageEntry)) {
      inMemoryRateCache.set(cacheKey, localStorageEntry)
      return { rate: localStorageEntry.rate, asOf: localStorageEntry.asOf }
    }
  }

  try {
    const fetchedRate = await fetchRate(base, quote)
    const cacheEntry: StoredRateEntry = {
      ...fetchedRate,
      expiresAt: Date.now() + TWELVE_HOURS_MS,
    }

    inMemoryRateCache.set(cacheKey, cacheEntry)
    writeLocalStorageEntry(cacheKey, cacheEntry)
    return fetchedRate
  } catch (error) {
    throw normalizeRateError(error)
  }
}

async function fetchRate(base: CurrencyCode, quote: CurrencyCode): Promise<RateResponse> {
  // Endpoint docs: https://www.frankfurter.app/docs/ (free public API, no API key).
  const endpoint = `https://api.frankfurter.app/latest?from=${base}&to=${quote}`
  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error(`Rate fetch failed with status ${response.status}`)
  }

  const payload: unknown = await response.json()
  if (!isRecord(payload) || !isRecord(payload.rates)) {
    throw new Error('Unexpected exchange rate response format')
  }

  const rateValue = payload.rates[quote]
  if (typeof rateValue !== 'number' || !Number.isFinite(rateValue) || rateValue <= 0) {
    throw new Error('Exchange rate value is missing or invalid')
  }

  const asOfValue = payload.date
  const asOf = typeof asOfValue === 'string' ? asOfValue : new Date().toISOString()

  return {
    rate: rateValue,
    asOf,
  }
}

function readLocalStorageEntry(cacheKey: string): StoredRateEntry | undefined {
  if (!isBrowser()) {
    return undefined
  }

  try {
    const serializedRates = window.localStorage.getItem(FX_STORAGE_KEY)
    if (!serializedRates) {
      return undefined
    }

    const parsedRates: unknown = JSON.parse(serializedRates)
    if (!isRecord(parsedRates)) {
      return undefined
    }

    return parseStoredRateEntry(parsedRates[cacheKey])
  } catch {
    return undefined
  }
}

function writeLocalStorageEntry(cacheKey: string, entry: StoredRateEntry) {
  if (!isBrowser()) {
    return
  }

  try {
    const serializedRates = window.localStorage.getItem(FX_STORAGE_KEY)
    const parsedRates = parseStoredRatesRecord(serializedRates)

    parsedRates[cacheKey] = entry
    window.localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(parsedRates))
  } catch {
    // Ignore write failures so quote creation is never blocked by FX cache issues.
  }
}

function parseStoredRatesRecord(serializedRates: string | null): Record<string, StoredRateEntry> {
  if (!serializedRates) {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(serializedRates)
    if (!isRecord(parsed)) {
      return {}
    }

    const normalized: Record<string, StoredRateEntry> = {}

    for (const [key, value] of Object.entries(parsed)) {
      const entry = parseStoredRateEntry(value)
      if (entry) {
        normalized[key] = entry
      }
    }

    return normalized
  } catch {
    return {}
  }
}

function parseStoredRateEntry(value: unknown): StoredRateEntry | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  if (
    typeof value.rate !== 'number' ||
    !Number.isFinite(value.rate) ||
    value.rate <= 0 ||
    typeof value.asOf !== 'string' ||
    typeof value.expiresAt !== 'number' ||
    !Number.isFinite(value.expiresAt)
  ) {
    return undefined
  }

  return {
    rate: value.rate,
    asOf: value.asOf,
    expiresAt: value.expiresAt,
  }
}

function isFresh(entry: StoredRateEntry | undefined): entry is StoredRateEntry {
  return Boolean(entry && entry.expiresAt > Date.now())
}

function normalizeRateError(_error: unknown): Error {
  return new Error('Conversion unavailable right now. Please try again.')
}

function buildCacheKey(base: CurrencyCode, quote: CurrencyCode) {
  return `${base}_${quote}`
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
