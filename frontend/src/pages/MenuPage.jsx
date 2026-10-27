import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Check, Search, ShoppingBag } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { api } from '../services/api'
import { useCart } from '../context/CartContext'
import { formatTZS } from '../utils/format'
import styles from './MenuPage.module.css'

export default function MenuPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('loading') // loading | ready | error
  const { add, count } = useCart()
  const [added, setAdded] = useState(null)

  useEffect(() => {
    let alive = true
    setStatus('loading')
    Promise.all([api.categories(), api.products()])
      .then(([cats, prods]) => {
        if (!alive) return
        setCategories(cats)
        setProducts(prods)
        setStatus('ready')
      })
      .catch(() => { if (alive) setStatus('error') })
    return () => { alive = false }
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const matchesCat = active === 'all' || p.category_slug === active
      const matchesQuery = !q || p.name.toLowerCase().includes(q)
      return matchesCat && matchesQuery
    })
  }, [products, active, query])

  function onAdd(p) {
    add(p, 1)
    setAdded(p.id)
    setTimeout(() => setAdded((cur) => (cur === p.id ? null : cur)), 1200)
  }

  return (
    <>
      <Nav />
      <main className="app-page">
        <div className="page-inner">
          <header className={styles.head}>
            <div>
              <span className="kicker">The Shelf</span>
              <h1 className={`serif-title ${styles.title}`}>Order Delivery</h1>
              <p className={styles.lede}>
                Everything behind the bar, sent to your door. Add what you like,
                then head to checkout.
              </p>
            </div>
            <Link to="/cart" className={`btn btn-ghost ${styles.cartBtn}`}>
              <ShoppingBag size={17} /> Cart{count > 0 ? ` · ${count}` : ''}
            </Link>
          </header>

          <div className={styles.controls}>
            <div className={styles.search}>
              <Search size={17} className={styles.searchIcon} />
              <input
                type="search"
                placeholder="Search drinks…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search drinks"
              />
            </div>
            <div className={styles.chips}>
              <button
                className={`${styles.chip} ${active === 'all' ? styles.chipActive : ''}`}
                onClick={() => setActive('all')}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  className={`${styles.chip} ${active === c.slug ? styles.chipActive : ''}`}
                  onClick={() => setActive(c.slug)}
                >
                  {c.name} <span className={styles.chipCount}>{c.count}</span>
                </button>
              ))}
            </div>
          </div>

          {status === 'loading' && <p className={styles.state}>Loading the shelf…</p>}
          {status === 'error' && (
            <p className={styles.state}>
              Couldn't reach the bar. Make sure the API is running, then refresh.
            </p>
          )}
          {status === 'ready' && visible.length === 0 && (
            <p className={styles.state}>Nothing matches that. Try another search.</p>
          )}

          {status === 'ready' && visible.length > 0 && (
            <div className={styles.grid}>
              {visible.map((p) => (
                <article key={p.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <span className={styles.cat}>{p.category}</span>
                    {p.volume && <span className={styles.vol}>{p.volume}</span>}
                  </div>
                  <h3 className={styles.name}>{p.name}</h3>
                  <div className={styles.cardFoot}>
                    <span className={styles.price}>{formatTZS(p.price)}</span>
                    <button
                      className={styles.add}
                      onClick={() => onAdd(p)}
                      disabled={!p.in_stock}
                      aria-label={`Add ${p.name} to cart`}
                    >
                      {added === p.id ? <Check size={16} /> : <Plus size={16} />}
                      {added === p.id ? 'Added' : p.in_stock ? 'Add' : 'Out'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
