// Central runtime config. API base comes from VITE_API_URL at build/dev time.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Flat delivery fee (TZS) shown in cart/checkout. Mirror of backend default.
export const DELIVERY_FEE = 3000

// Brand facts reused across sections.
export const BRAND = {
  name: "Johnnie's Place",
  tagline: 'The bar, delivered.',
  city: 'Dar es Salaam, Tanzania',
  phone: '+255 744 000 000',
  email: 'hello@johnniesplace.co.tz',
  address: '14 Haile Selassie Rd, Oyster Bay',
}
