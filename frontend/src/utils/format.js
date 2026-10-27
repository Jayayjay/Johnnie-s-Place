// Format a whole-shilling amount as "TZS 7,000". Currency is centralised here
// so switching it later is a one-line change.
const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatTZS(amount) {
  const n = Number(amount) || 0
  return `TZS ${nf.format(Math.round(n))}`
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
