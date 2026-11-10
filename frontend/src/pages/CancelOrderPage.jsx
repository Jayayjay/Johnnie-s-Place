import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { api, ApiError } from '../services/api'
import { formatTZS } from '../utils/format'
import styles from './CancelOrderPage.module.css'

const REASONS = [
  'Ordered by mistake',
  'Changed my mind',
  'Taking too long',
  'Found it cheaper elsewhere',
  'Other',
]

export default function CancelOrderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | notfound | done
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    api.order(id)
      .then((data) => {
        if (!alive) return
        setOrder(data)
        setState('ready')
      })
      .catch(() => { if (alive) setState('notfound') })
    return () => { alive = false }
  }, [id])

  async function confirmCancel() {
    setError('')
    setBusy(true)
    const full = [reason, detail.trim()].filter(Boolean).join(' — ')
    try {
      const updated = await api.cancelOrder(id, full)
      setOrder(updated)
      setState('done')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel the order. Try again.')
      setBusy(false)
    }
  }

  return (
    <>
      <Nav />
      <main className="app-page">
        <div className={styles.wrap}>
          {state === 'loading' && <p className={styles.state}>Loading your order…</p>}

          {state === 'notfound' && (
            <div className={styles.state}>
              <h1 className={`serif-title ${styles.title}`}>Order not found</h1>
              <p>We couldn't find order #{id}.</p>
              <Link to="/menu" className="btn btn-primary">Start a New Order</Link>
            </div>
          )}

          {state === 'ready' && order && !order.cancellable && (
            <div className={styles.card}>
              <span className={`${styles.badge} ${styles.badgeWarn}`}>
                <AlertTriangle size={15} /> Can't cancel
              </span>
              <h1 className={`serif-title ${styles.title}`}>Too late to cancel</h1>
              <p className={styles.lede}>
                Order #{order.id} is <strong>{order.status_label.toLowerCase()}</strong> and can no
                longer be cancelled. Give us a call if something's wrong.
              </p>
              <Link to={`/order/${order.id}`} className="btn btn-ghost">Back to Order</Link>
            </div>
          )}

          {state === 'ready' && order && order.cancellable && (
            <div className={styles.card}>
              <span className={styles.badge}><AlertTriangle size={15} /> Cancel order</span>
              <h1 className={`serif-title ${styles.title}`}>Cancel order #{order.id}?</h1>
              <p className={styles.lede}>
                This stops your delivery. You won't be charged. This can't be undone.
              </p>

              <ul className={styles.summary}>
                {order.items.map((it) => (
                  <li key={it.id}>
                    <span><span className={styles.qty}>{it.quantity}×</span> {it.name}</span>
                    <span>{formatTZS(it.line_total)}</span>
                  </li>
                ))}
                <li className={styles.total}><span>Total</span><span>{formatTZS(order.total)}</span></li>
              </ul>

              <div className={styles.reasons}>
                <span className={styles.reasonLabel}>Mind telling us why? (optional)</span>
                <div className={styles.chips}>
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`${styles.chip} ${reason === r ? styles.chipActive : ''}`}
                      onClick={() => setReason(reason === r ? '' : r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {reason === 'Other' && (
                  <textarea
                    className={styles.detail}
                    rows={2}
                    placeholder="Tell us more…"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                  />
                )}
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.actions}>
                <button className={`btn ${styles.danger}`} onClick={confirmCancel} disabled={busy}>
                  {busy ? 'Cancelling…' : 'Yes, cancel order'}
                </button>
                <button className="btn btn-ghost" onClick={() => navigate(`/order/${order.id}`)} disabled={busy}>
                  <ArrowLeft size={16} /> Keep my order
                </button>
              </div>
            </div>
          )}

          {state === 'done' && order && (
            <div className={styles.card}>
              <span className={styles.doneIcon}><Check size={26} /></span>
              <h1 className={`serif-title ${styles.title}`}>Order cancelled</h1>
              <p className={styles.lede}>
                Order #{order.id} has been cancelled and won't be delivered. Sorry to see
                this one go — we'll be here when you're thirsty again.
              </p>
              <div className={styles.actions}>
                <Link to="/menu" className="btn btn-primary">Start a New Order</Link>
                <Link to={`/order/${order.id}`} className="btn btn-ghost">View Order</Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
