import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, Clock, PackageCheck, Truck, Home } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { api } from '../services/api'
import { formatTZS } from '../utils/format'
import styles from './OrderTrackPage.module.css'

const STEPS = [
  { key: 'pending',          label: 'Order received', Icon: Clock },
  { key: 'confirmed',        label: 'Confirmed',      Icon: PackageCheck },
  { key: 'out_for_delivery', label: 'On the way',     Icon: Truck },
  { key: 'delivered',        label: 'Delivered',      Icon: Home },
]

export default function OrderTrackPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const timer = useRef(null)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const data = await api.order(id)
        if (!alive) return
        setOrder(data)
        setStatus('ready')
        // Keep polling until the order is delivered or cancelled.
        if (!['delivered', 'cancelled'].includes(data.status)) {
          timer.current = setTimeout(load, 8000)
        }
      } catch {
        if (alive) setStatus('error')
      }
    }
    load()
    return () => {
      alive = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [id])

  const activeIndex = order ? STEPS.findIndex((s) => s.key === order.status) : -1
  const cancelled = order?.status === 'cancelled'

  return (
    <>
      <Nav />
      <main className="app-page">
        <div className="page-inner">
          {status === 'loading' && <p className={styles.state}>Finding your order…</p>}

          {status === 'error' && (
            <div className={styles.state}>
              <h1 className={`serif-title ${styles.title}`}>Order not found</h1>
              <p>We couldn't find order #{id}.</p>
              <Link to="/menu" className="btn btn-primary">Start a New Order</Link>
            </div>
          )}

          {status === 'ready' && order && (
            <>
              <header className={styles.head}>
                <span className="kicker">Order #{order.id}</span>
                <h1 className={`serif-title ${styles.title}`}>
                  {cancelled ? 'Order cancelled' : 'Thanks — we\'re on it'}
                </h1>
                <p className={styles.lede}>
                  {cancelled
                    ? 'This order was cancelled. Get in touch if that\'s a surprise.'
                    : `Hi ${order.customer_name.split(' ')[0]}, we'll call ${order.phone} when the rider sets off.`}
                </p>
              </header>

              {!cancelled && (
                <ol className={styles.timeline}>
                  {STEPS.map((step, i) => {
                    const done = i < activeIndex
                    const active = i === activeIndex
                    return (
                      <li
                        key={step.key}
                        className={`${styles.step} ${done ? styles.done : ''} ${active ? styles.active : ''}`}
                      >
                        <span className={styles.dot}>
                          {done ? <Check size={16} /> : <step.Icon size={16} />}
                        </span>
                        <span className={styles.stepLabel}>{step.label}</span>
                      </li>
                    )
                  })}
                </ol>
              )}

              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>Order summary</h2>
                  <span className={`${styles.badge} ${cancelled ? styles.badgeOff : ''}`}>
                    {order.status_label}
                  </span>
                </div>
                <ul className={styles.items}>
                  {order.items.map((it) => (
                    <li key={it.id} className={styles.item}>
                      <span><span className={styles.qty}>{it.quantity}×</span> {it.name}</span>
                      <span>{formatTZS(it.line_total)}</span>
                    </li>
                  ))}
                </ul>
                <div className={styles.sumRow}><span>Subtotal</span><span>{formatTZS(order.subtotal)}</span></div>
                <div className={styles.sumRow}><span>Delivery</span><span>{formatTZS(order.delivery_fee)}</span></div>
                <div className={`${styles.sumRow} ${styles.total}`}><span>Total</span><span>{formatTZS(order.total)}</span></div>
                <div className={styles.deliverTo}>
                  <span className={styles.deliverLabel}>Delivering to</span>
                  <span>{order.address}</span>
                </div>
              </div>

              <div className={styles.actions}>
                <Link to="/menu" className="btn btn-ghost">Order Again</Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
