import { Suspense, lazy, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Wine, Clock } from 'lucide-react'
import { BRAND } from '../config'
import ErrorBoundary from './ErrorBoundary'
import styles from './Hero.module.css'

// 3D layer loads on demand so the first paint isn't blocked by three.js.
const Bottle3D = lazy(() => import('./Bottle3D'))

const TRUST_ITEMS = [
  { Icon: Truck, label: 'Same-night delivery' },
  { Icon: Wine,  label: '60+ bottles in stock' },
  { Icon: Clock, label: 'Open till 2am' },
]

export default function Hero() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function anim(delay, extra = '') {
    return {
      className: `${styles.item} ${ready ? styles.animate : ''} ${extra}`.trim(),
      style: { '--delay': delay },
    }
  }

  return (
    <header id="top" className={styles.hero}>
      <ErrorBoundary fallback={<div className={styles.bgFallback} aria-hidden="true" />}>
        <Suspense fallback={<div className={styles.bgFallback} aria-hidden="true" />}>
          <Bottle3D />
        </Suspense>
      </ErrorBoundary>

      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.content}>
        <div {...anim('0.15s')}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden="true" />
            <span className={styles.badgeText}>Est. 2021 · {BRAND.city}</span>
          </div>
        </div>

        <h1 className={styles.headline}>
          <span {...anim('0.35s', styles.block)}>The bar is</span>
          <em {...anim('0.55s', styles.accent)}>open late.</em>
        </h1>

        <p {...anim('0.75s', styles.sub)}>
          A moody neighbourhood bar and bottle shop. Cold beers, rare spirits
          and honest wine — poured at the counter or sent straight to your door.
        </p>

        <div {...anim('0.85s', styles.trust)}>
          {TRUST_ITEMS.map(({ Icon, label }) => (
            <span className={styles.trustItem} key={label}>
              <Icon className={styles.trustIcon} size={15} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>

        <div {...anim('0.95s', styles.actions)}>
          <Link to="/menu" className="btn btn-primary">Order Delivery</Link>
          <a href="#signature" className="btn btn-ghost">See the Menu →</a>
        </div>
      </div>

      <div className={styles.scrollHint} {...anim('1.3s')} aria-hidden="true">
        <span className={styles.scrollLine} />
        <span className={styles.scrollLabel}>Scroll</span>
      </div>
    </header>
  )
}
