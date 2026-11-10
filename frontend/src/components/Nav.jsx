import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Menu as MenuIcon, X, User, LogOut } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const { count } = useCart()
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const menuRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the account menu on outside click.
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const firstName = user?.name?.split(' ')[0] || 'Account'

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} onClick={() => setOpen(false)}>
          <span className={styles.glyph}>J</span>
          <span className={styles.name}>Johnnie's <em>Pub</em></span>
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
          {isAuthenticated ? (
            <div className={styles.account} ref={menuRef}>
              <button
                className={styles.accountBtn}
                aria-label="Account menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className={styles.avatar}>{firstName[0]?.toUpperCase()}</span>
                <span className={styles.accountName}>{firstName}</span>
              </button>
              {menuOpen && (
                <div className={styles.menu}>
                  <div className={styles.menuEmail}>{user?.email}</div>
                  <button className={styles.menuItem} onClick={() => { setMenuOpen(false); logout() }}>
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.signin}>
              <User size={16} strokeWidth={1.9} /> <span className={styles.signinText}>Sign in</span>
            </Link>
          )}

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
