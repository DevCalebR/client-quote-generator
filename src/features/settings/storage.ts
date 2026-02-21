import type { CurrencyCode } from '../quotes/types'

const SETTINGS_STORAGE_KEY = 'client-quote-generator:settings:v1'

const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] as const

export interface AppSettings {
  baseCurrency: CurrencyCode
  clientCurrency: CurrencyCode
  taxRateDefault?: number
}

export const defaultSettings: AppSettings = {
  baseCurrency: 'USD',
  clientCurrency: 'USD',
}

export function getSettings(): AppSettings {
  if (!isBrowser()) {
    return defaultSettings
  }

  const serializedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
  if (!serializedSettings) {
    return defaultSettings
  }

  try {
    const parsedSettings: unknown = JSON.parse(serializedSettings)
    return normalizeSettings(parsedSettings)
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: AppSettings): AppSettings {
  const normalizedSettings = normalizeSettings(settings)

  if (isBrowser()) {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings))
    } catch {
      // Ignore write failures so settings issues never crash the app.
    }
  }

  return normalizedSettings
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return supportedCurrencies.some((currency) => currency === value)
}

export function getSupportedCurrencies(): CurrencyCode[] {
  return [...supportedCurrencies]
}

function normalizeSettings(value: unknown): AppSettings {
  const baseCurrency = readCurrency(value, 'baseCurrency') ?? defaultSettings.baseCurrency
  const clientCurrency = readCurrency(value, 'clientCurrency') ?? defaultSettings.clientCurrency
  const taxRateDefault = readTaxRateDefault(value)

  return {
    baseCurrency,
    clientCurrency,
    ...(taxRateDefault === undefined ? {} : { taxRateDefault }),
  }
}

function readCurrency(value: unknown, key: 'baseCurrency' | 'clientCurrency') {
  if (!isRecord(value)) {
    return undefined
  }

  const rawCurrency = value[key]
  if (typeof rawCurrency !== 'string') {
    return undefined
  }

  return isCurrencyCode(rawCurrency) ? rawCurrency : undefined
}

function readTaxRateDefault(value: unknown) {
  if (!isRecord(value)) {
    return undefined
  }

  const rawTaxRate = value.taxRateDefault
  if (typeof rawTaxRate !== 'number' || !Number.isFinite(rawTaxRate)) {
    return undefined
  }

  if (rawTaxRate < 0 || rawTaxRate > 15) {
    return undefined
  }

  return rawTaxRate
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
