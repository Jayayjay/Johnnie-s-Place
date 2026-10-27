import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Menu as MenuIcon, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import styles from './Nav.module.css'

const LINKS = [
  { href: '/#signature', label: 'Drinks' },
  { href: '/#gallery',   label: 'The Room' },
  { href: '/#hours',     label: 'Hours' },
  { href: '/#contact',   label: 'Visit' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { count } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} onClick={() => setOpen(false)}>
          <span className={styles.glyph}>J</span>
          <span className={styles.name}>Johnnie's <em>Place</em></span>
        </Link>

        <nav className={`${styles.links} ${open ? styles.open : ''}`}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={styles.link} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <Link to="/menu" className={styles.linkCta} onClick={() => setOpen(false)}>
            Order Delivery
          </Link>
        </nav>

        <div className={styles.actions}>
          <button
            className={styles.cart}
            aria-label={`Cart, ${count} items`}
            onClick={() => navigate('/cart')}
          >
            <ShoppingBag size={19} strokeWidth={1.75} />
            {count > 0 && <span className={styles.badge}>{count}</span>}
          </button>
          <button
            className={styles.burger}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}
