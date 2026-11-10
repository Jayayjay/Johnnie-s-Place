import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, MessageCircle } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import ContactBarModal from '../components/ContactBarModal'
import { useCart } from '../context/CartContext'
import { formatTZS } from '../utils/format'
import { MIN_ONLINE_ORDER } from '../config'
import styles from './CartPage.module.css'

export default function CartPage() {
  const { items, subtotal, setQty, remove, count } = useCart()
  const navigate = useNavigate()
  const [contactOpen, setContactOpen] = useState(false)
  const meetsMinimum = subtotal >= MIN_ONLINE_ORDER

  return (
    <>
      <Nav />
      <main className="app-page">
        <div className="page-inner">
          <header className={styles.head}>
            <span className="kicker">Your Order</span>
            <h1 className={`serif-title ${styles.title}`}>The Cart</h1>
          </header>

          {items.length === 0 ? (
            <div className={styles.empty}>
              <ShoppingBag size={40} strokeWidth={1.25} className={styles.emptyIcon} />
              <p>Your cart is empty.</p>
              <Link to="/menu" className="btn btn-primary">Browse the Shelf</Link>
            </div>
          ) : (
            <div className={styles.layout}>
              <ul className={styles.list}>
                {items.map((i) => (
                  <li key={i.id} className={styles.row}>
                    <div className={styles.info}>
                      <h3 className={styles.name}>{i.name}</h3>
                      <span className={styles.meta}>
                        {i.category}{i.volume ? ` · ${i.volume}` : ''} · {formatTZS(i.price)}
                      </span>
                    </div>
                    <div className={styles.qty}>
                      <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease quantity">
                        <Minus size={15} />
                      </button>
                      <span>{i.qty}</span>
                      <button onClick={() => setQty(i.id, i.qty + 1)} aria-label="Increase quantity">
                        <Plus size={15} />
                      </button>
                    </div>
                    <span className={styles.lineTotal}>{formatTZS(i.price * i.qty)}</span>
                    <button className={styles.remove} onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>

              <aside className={styles.summary}>
                <h2 className={styles.summaryTitle}>Summary</h2>
                <div className={styles.sumRow}>
                  <span>Subtotal ({count} item{count !== 1 ? 's' : ''})</span>
                  <span>{formatTZS(subtotal)}</span>
                </div>
                <div className={styles.sumRow}>
                  <span>Delivery</span>
                  <span className={styles.muted}>by distance, at checkout</span>
                </div>
                <div className={`${styles.sumRow} ${styles.total}`}>
                  <span>Subtotal</span>
                  <span>{formatTZS(subtotal)}</span>
                </div>

                {meetsMinimum ? (
                  <button className={`btn btn-primary ${styles.checkout}`} onClick={() => navigate('/checkout')}>
                    Checkout <ArrowRight size={17} />
                  </button>
                ) : (
                  <div className={styles.belowMin}>
                    <p className={styles.belowMinMsg}>
                      Online orders start at {formatTZS(MIN_ONLINE_ORDER)} — you're {formatTZS(MIN_ONLINE_ORDER - subtotal)} away.
                      Add more, or order this straight from the bar.
                    </p>
                    <button className={`btn btn-primary ${styles.checkout}`} onClick={() => setContactOpen(true)}>
                      <MessageCircle size={17} /> Contact the Bar
                    </button>
                  </div>
                )}
                <Link to="/menu" className={styles.continue}>← Add more drinks</Link>
              </aside>
            </div>
          )}
        </div>
      </main>
      <ContactBarModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        items={items}
        subtotal={subtotal}
        message={`Online delivery starts at ${formatTZS(MIN_ONLINE_ORDER)}. For a smaller order, reach us directly and we'll sort you out.`}
      />
      <Footer />
    </>
  )
}
