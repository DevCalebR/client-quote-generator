import type { LineItem, QuoteTotals } from './types'

export function calculateTotals(
  items: Array<Pick<LineItem, 'qty' | 'unitPrice'>>,
  taxRate: number,
  discount: number,
): QuoteTotals {
  const subtotal = roundCurrency(
    items.reduce((sum, item) => {
      const qty = sanitizeNumber(item.qty)
      const unitPrice = sanitizeNumber(item.unitPrice)
      return sum + qty * unitPrice
    }, 0),
  )

  const normalizedTaxRate = clamp(sanitizeNumber(taxRate), 0, 100)
  const normalizedDiscountRate = clamp(sanitizeNumber(discount), 0, 100)

  const tax = roundCurrency(subtotal * (normalizedTaxRate / 100))
  const discountAmount = roundCurrency(subtotal * (normalizedDiscountRate / 100))
  const total = roundCurrency(Math.max(0, subtotal + tax - discountAmount))

  return {
    subtotal,
    tax,
    discount: discountAmount,
    total,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sanitizeNumber(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return value
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
