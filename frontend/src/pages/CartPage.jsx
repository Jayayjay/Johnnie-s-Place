import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { formatTZS } from '../utils/format'
import { DELIVERY_FEE } from '../config'
import styles from './CartPage.module.css'

export default function CartPage() {
  const { items, subtotal, setQty, remove, count } = useCart()
  const navigate = useNavigate()
  const total = subtotal + (items.length ? DELIVERY_FEE : 0)

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
                  <span>{formatTZS(DELIVERY_FEE)}</span>
                </div>
                <div className={`${styles.sumRow} ${styles.total}`}>
                  <span>Total</span>
                  <span>{formatTZS(total)}</span>
                </div>
                <button className={`btn btn-primary ${styles.checkout}`} onClick={() => navigate('/checkout')}>
                  Checkout <ArrowRight size={17} />
                </button>
                <Link to="/menu" className={styles.continue}>← Add more drinks</Link>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
