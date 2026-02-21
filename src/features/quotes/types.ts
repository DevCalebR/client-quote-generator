export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined'

export type CurrencyCode = 'USD' | 'EUR' | 'GBP'

export interface QuoteLineItem {
  description: string
  id: string
  quantity: number
  total: number
  unitPrice: number
}

export interface QuoteTotals {
  subtotal: number
  taxAmount: number
  taxRate: number
  total: number
}

export interface Quote {
  clientName: string
  createdAt: string
  currency: CurrencyCode
  id: string
  lineItems: QuoteLineItem[]
  notes?: string
  projectName: string
  status: QuoteStatus
  totals: QuoteTotals
  updatedAt: string
}

export type NewQuoteInput = Omit<Quote, 'createdAt' | 'id' | 'updatedAt'>
