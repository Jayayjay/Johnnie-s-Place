import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'
import { api } from '../services/api'
import { useCart } from '../context/CartContext'
import { formatTZS } from '../utils/format'
import useInView from '../hooks/useInView'
import styles from './Signature.module.css'

// A few hand-picked highlights across categories. We ask the API for the whole
// catalog, then surface one standout per flagship category.
const FEATURE_ORDER = ['Whisky', 'Beer & Cider', 'Wine', 'Gin & Local Spirits', 'Brandy & Cognac', 'Vodka']

function pickFeatured(products) {
  const byCat = {}
  for (const p of products) {
    if (!byCat[p.category]) byCat[p.category] = []
    byCat[p.category].push(p)
  }
  const picks = []
  for (const cat of FEATURE_ORDER) {
    const list = (byCat[cat] || []).slice().sort((a, b) => b.price - a.price)
    if (list[0]) picks.push(list[0])
  }
  return picks.slice(0, 6)
}

export default function Signature() {
  const [ref, inView] = useInView()
  const [products, setProducts] = useState([])
  const [error, setError] = useState(false)
  const { add } = useCart()
  const [added, setAdded] = useState(null)

  useEffect(() => {
    let alive = true
    api.products()
      .then((data) => { if (alive) setProducts(pickFeatured(data)) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [])

  function onAdd(p) {
    add(p, 1)
    setAdded(p.id)
    setTimeout(() => setAdded((cur) => (cur === p.id ? null : cur)), 1400)
  }

  return (
    <section id="signature" className={styles.section} ref={ref}>
      <div className={styles.head}>
        <span className="kicker">The Selection</span>
        <h2 className={`serif-title ${styles.title}`}>Poured with intent</h2>
        <p className={styles.lede}>
          From single-malt Scotch to ice-cold Serengeti and local Konyagi —
          a tight, well-kept list. Here's a taste of the shelf.
        </p>
      </div>

      {error ? (
        <p className={styles.empty}>
          Menu is warming up. <Link to="/menu" className={styles.inlineLink}>Browse the full list →</Link>
        </p>
      ) : (
        <div className={styles.grid}>
          {products.map((p, i) => (
            <article
              key={p.id}
              className={`${styles.card} reveal ${inView ? 'in' : ''}`}
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <div className={styles.cardTop}>
                <span className={styles.cat}>{p.category}</span>
                {p.volume && <span className={styles.vol}>{p.volume}</span>}
              </div>
              <h3 className={styles.name}>{p.name}</h3>
              <div className={styles.cardFoot}>
                <span className={styles.price}>{formatTZS(p.price)}</span>
                <button className={styles.add} onClick={() => onAdd(p)} aria-label={`Add ${p.name} to cart`}>
                  {added === p.id ? <Check size={16} /> : <Plus size={16} />}
                  {added === p.id ? 'Added' : 'Add'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className={styles.cta}>
        <Link to="/menu" className="btn btn-ghost">View Full Menu →</Link>
      </div>
    </section>
  )
}
