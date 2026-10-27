import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { api, ApiError } from '../services/api'
import { formatTZS } from '../utils/format'
import { DELIVERY_FEE } from '../config'
import styles from './CheckoutPage.module.css'

const EMPTY = { customer_name: '', phone: '', address: '', note: '' }

function validate(form) {
  const errors = {}
  if (!form.customer_name.trim()) errors.customer_name = 'Tell us who to ask for.'
  const digits = form.phone.replace(/[^\d]/g, '')
  if (digits.length < 9) errors.phone = 'Enter a reachable phone number.'
  if (form.address.trim().length < 8) errors.address = 'Add a full delivery address.'
  return errors
}

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const total = subtotal + (items.length ? DELIVERY_FEE : 0)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setServerError('')
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      const order = await api.createOrder({
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
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
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => update('customer_name', e.target.value)}
                  placeholder="e.g. Amina Juma"
                  autoComplete="name"
                />
              </Field>

              <Field label="Phone number" error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+255 7XX XXX XXX"
                  autoComplete="tel"
                />
              </Field>

              <Field label="Delivery address" error={errors.address}>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="Street, building, area, landmark…"
                  autoComplete="street-address"
                />
              </Field>

              <Field label="Note for the rider (optional)">
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => update('note', e.target.value)}
                  placeholder="Gate code, apartment number, anything helpful."
                />
              </Field>

              {serverError && <p className={styles.serverError}>{serverError}</p>}

              <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
                {submitting ? 'Placing order…' : <>Place Order · {formatTZS(total)} <ArrowRight size={17} /></>}
              </button>
              <p className={styles.payNote}>Pay with cash or mobile money on delivery.</p>
            </form>

            <aside className={styles.summary}>
              <h2 className={styles.summaryTitle}>Your order</h2>
              <ul className={styles.items}>
                {items.map((i) => (
                  <li key={i.id} className={styles.item}>
                    <span className={styles.itemName}>
                      <span className={styles.itemQty}>{i.qty}×</span> {i.name}
                    </span>
                    <span>{formatTZS(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.sumRow}><span>Subtotal</span><span>{formatTZS(subtotal)}</span></div>
              <div className={styles.sumRow}><span>Delivery</span><span>{formatTZS(DELIVERY_FEE)}</span></div>
              <div className={`${styles.sumRow} ${styles.total}`}><span>Total</span><span>{formatTZS(total)}</span></div>
            </aside>
          </div>
        </div>
      </main>
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
