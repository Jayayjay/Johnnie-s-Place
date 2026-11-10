// Central runtime config. API base comes from VITE_API_URL at build/dev time.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Minimum subtotal (TZS) to order online. Below it, the site routes to WhatsApp.
// Mirror of the backend's MIN_ONLINE_ORDER (the server is authoritative).
export const MIN_ONLINE_ORDER = 50000

// Bar WhatsApp Business number, international format, digits only (no +).
// Set VITE_BAR_WHATSAPP in .env.local. Empty → the WhatsApp buttons are hidden.
export const BAR_WHATSAPP = import.meta.env.VITE_BAR_WHATSAPP || ''

// Bar location (Unguja, Zanzibar) — used to centre the map and show the bar marker.
export const BAR_LOCATION = { lat: -6.272989, lng: 39.254765 }

// Google OAuth Web client ID for Sign in with Google. Set VITE_GOOGLE_CLIENT_ID in
// .env.local. When empty the login page shows a configuration note instead of a
// broken button.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Brand facts reused across sections.
export const BRAND = {
  name: "Johnnie's Pub",
  tagline: 'The bar, delivered.',
  city: 'Dar es Salaam, Tanzania',
  phone: '+255 744 000 000',
  email: 'hello@johnniesplace.co.tz',
  address: '14 Haile Selassie Rd, Oyster Bay',
}
