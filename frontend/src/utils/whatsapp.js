import { BAR_WHATSAPP } from '../config'
import { formatTZS } from './format'

// Build a wa.me deep link to the bar, prefilled with the cart + an intro line.
// Returns null when no number is configured (callers hide the button).
export function whatsappOrderLink(items = [], subtotal = 0, extra = '') {
  if (!BAR_WHATSAPP) return null
  const lines = items.map((i) => `• ${i.qty} × ${i.name} — ${formatTZS(i.price * i.qty)}`)
  const body = [
    "Hi Johnnie's Pub! I'd like to place an order:",
    ...lines,
    items.length ? `Subtotal: ${formatTZS(subtotal)}` : '',
    extra,
    'Can you help with delivery?',
  ].filter(Boolean).join('\n')
  return `https://wa.me/${BAR_WHATSAPP}?text=${encodeURIComponent(body)}`
}

export function whatsappContactLink(message = "Hi Johnnie's Pub! I have a question.") {
  if (!BAR_WHATSAPP) return null
  return `https://wa.me/${BAR_WHATSAPP}?text=${encodeURIComponent(message)}`
}
