import { Link } from 'react-router-dom'
import { BRAND } from '../config'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <Link to="/" className={styles.brand}>
            <span className={styles.glyph}>J</span>
            <span className={styles.name}>Johnnie's <em>Place</em></span>
          </Link>
          <p className={styles.tagline}>{BRAND.tagline}</p>
        </div>

        <nav className={styles.cols}>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Explore</h4>
            <a href="#signature">Drinks</a>
            <a href="#gallery">The Room</a>
            <a href="#hours">Hours</a>
            <Link to="/menu">Order Delivery</Link>
          </div>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Visit</h4>
            <span>{BRAND.address}</span>
            <span>{BRAND.city}</span>
            <a href={`tel:${BRAND.phone.replace(/\s+/g, '')}`}>{BRAND.phone}</a>
          </div>
        </nav>
      </div>

      <div className={styles.bar}>
        <span>© {year} {BRAND.name}. Please drink responsibly.</span>
        <span className={styles.note}>Sales to persons 18+ only.</span>
      </div>
    </footer>
  )
}
