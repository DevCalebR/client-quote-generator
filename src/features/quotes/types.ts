export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined'

export type CurrencyCode = 'USD' | 'EUR' | 'GBP'

export type ProjectType =
  | 'website'
  | 'mobile-app'
  | 'branding'
  | 'marketing'
  | 'other'

export interface ClientInfo {
  name: string
  email: string
  company?: string
}

export interface LineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
}

export interface QuoteTotals {
  subtotal: number
  tax: number
  discount: number
  total: number
}

export interface Quote {
  id: string
  client: ClientInfo
  scope: {
    description: string
    desiredStartDate: string
    projectType: ProjectType
  }
  currency: CurrencyCode
  lineItems: LineItem[]
  taxRate: number
  discountRate: number
  totals: QuoteTotals
  status: QuoteStatus
  createdAt: string
  updatedAt: string
}
