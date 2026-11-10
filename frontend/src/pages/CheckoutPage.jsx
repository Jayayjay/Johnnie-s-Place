import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import LocationPicker from '../components/LocationPicker'
import ContactBarModal from '../components/ContactBarModal'
import { MessageCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../services/api'
import { formatTZS } from '../utils/format'
import { MIN_ONLINE_ORDER } from '../config'
import styles from './CheckoutPage.module.css'

const EMPTY = { customer_name: '', phone: '', address: '', note: '' }

function validate(form, location) {
  const errors = {}
  if (!form.customer_name.trim()) errors.customer_name = 'Tell us who to ask for.'
  const digits = form.phone.replace(/[^\d]/g, '')
  if (digits.length < 9) errors.phone = 'Enter a reachable phone number.'
  if (form.address.trim().length < 8) errors.address = 'Add a full delivery address.'
  if (!location) errors.location = 'Set your delivery location on the map.'
  return errors
}

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => ({ ...EMPTY, customer_name: user?.name || '' }))
  const [location, setLocation] = useState(null) // {lat,lng} | null
  const [quote, setQuote] = useState(null)        // server quote | null
  const [quoting, setQuoting] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [contactOpen, setContactOpen] = useState(false)
  const timer = useRef(null)

  const meetsMinimum = subtotal >= MIN_ONLINE_ORDER

  // Debounced live quote whenever the pin or subtotal changes.
  useEffect(() => {
    if (!location) { setQuote(null); return }
    setQuoting(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const q = await api.deliveryQuote({ subtotal, lat: location.lat, lng: location.lng })
        setQuote(q)
      } catch {
        setQuote(null)
      } finally {
        setQuoting(false)
      }
    }, 450)
    return () => clearTimeout(timer.current)
  }, [location, subtotal])

  const canOrder = !!quote && quote.orderable
  const displayTotal = quote?.orderable ? quote.total : subtotal

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setServerError('')
    const found = validate(form, location)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    if (!canOrder) return

    setSubmitting(true)
    try {
      const order = await api.createOrder({
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
        lat: location.lat,
        lng: location.lng,
        items: items.map((i) => ({ product: i.id, quantity: i.qty })),
      })
      clear()
      navigate(`/order/${order.id}`)
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <>
        <Nav />
        <main className="app-page">
          <div className="page-inner">
            <div className={styles.emptyState}>
              <h1 className={`serif-title ${styles.title}`}>Nothing to check out</h1>
              <p>Your cart is empty — add a few drinks first.</p>
              <Link to="/menu" className="btn btn-primary">Browse the Shelf</Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Why online ordering is blocked right now (if it is).
  const blockReason = !meetsMinimum
    ? `Online orders start at ${formatTZS(MIN_ONLINE_ORDER)}. You're ${formatTZS(MIN_ONLINE_ORDER - subtotal)} away — add a little more, or order smaller amounts straight from the bar on WhatsApp.`
    : quote && !quote.serviceable && location
      ? (quote.reason || 'That spot is outside our delivery area.')
      : null

  return (
    <>
      <Nav />
      <main className="app-page">
        <div className="page-inner">
          <header className={styles.head}>
            <span className="kicker">Almost There</span>
            <h1 className={`serif-title ${styles.title}`}>Checkout</h1>
          </header>

          <div className={styles.layout}>
            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <h2 className={styles.formTitle}>Delivery details</h2>

              <Field label="Full name" error={errors.customer_name}>
                <input type="text" value={form.customer_name} onChange={(e) => update('customer_name', e.target.value)} placeholder="e.g. Amina Juma" autoComplete="name" />
              </Field>

              <Field label="Phone number" error={errors.phone}>
                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+255 7XX XXX XXX" autoComplete="tel" />
              </Field>

              <Field label="Delivery address" error={errors.address}>
                <textarea rows={2} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Street, building, area, landmark…" autoComplete="street-address" />
              </Field>

              <div className={styles.field}>
                <span className={styles.fieldLabel}><MapPin size={14} /> Pin your location (sets the delivery distance &amp; fee)</span>
                <LocationPicker value={location} onChange={setLocation} />
                {errors.location && <span className={styles.fieldError}>{errors.location}</span>}
              </div>

              <Field label="Note for the rider (optional)">
                <textarea rows={2} value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="Gate code, apartment number, anything helpful." />
              </Field>

              {serverError && <p className={styles.serverError}>{serverError}</p>}

              {blockReason ? (
                <div className={styles.blocked}>
                  <p className={styles.blockedMsg}>{blockReason}</p>
                  <button type="button" className={`btn btn-primary ${styles.submit}`} onClick={() => setContactOpen(true)}>
                    <MessageCircle size={17} /> Contact the Bar
                  </button>
                </div>
              ) : (
                <>
                  <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting || !canOrder}>
                    {submitting
                      ? 'Placing order…'
                      : canOrder
                        ? <>Place Order · {formatTZS(displayTotal)} <ArrowRight size={17} /></>
                        : (location ? 'Checking delivery…' : 'Set your location above')}
                  </button>
                  <p className={styles.payNote}>Pay with cash or mobile money on delivery.</p>
                </>
              )}
            </form>

            <aside className={styles.summary}>
              <h2 className={styles.summaryTitle}>Your order</h2>
              <ul className={styles.items}>
                {items.map((i) => (
                  <li key={i.id} className={styles.item}>
                    <span className={styles.itemName}><span className={styles.itemQty}>{i.qty}×</span> {i.name}</span>
                    <span>{formatTZS(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.sumRow}><span>Subtotal</span><span>{formatTZS(subtotal)}</span></div>
              <div className={styles.sumRow}>
                <span>Delivery{quote?.distance_km != null ? ` · ${quote.distance_km} km` : ''}</span>
                <span>
                  {!location ? <em className={styles.muted}>set location</em>
                    : quoting ? <em className={styles.muted}>…</em>
                    : quote?.delivery_fee != null ? formatTZS(quote.delivery_fee)
                    : <em className={styles.muted}>—</em>}
                </span>
              </div>
              <div className={`${styles.sumRow} ${styles.total}`}>
                <span>Total</span>
                <span>{quote?.orderable ? formatTZS(quote.total) : formatTZS(subtotal) + '+'}</span>
              </div>
              <p className={styles.minNote}>Online orders from {formatTZS(MIN_ONLINE_ORDER)}. Delivery is priced by distance.</p>
            </aside>
          </div>
        </div>
      </main>
      <ContactBarModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        items={items}
        subtotal={subtotal}
        message={blockReason}
      />
      <Footer />
    </>
  )
}

function Field({ label, error, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {error && <span className={styles.fieldError}>{error}</span>}
    </label>
  )
}
