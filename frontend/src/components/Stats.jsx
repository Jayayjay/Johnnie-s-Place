import useInView from '../hooks/useInView'
import styles from './Stats.module.css'

const STATS = [
  { value: '60+',  label: 'Bottles on the shelf' },
  { value: '9',    label: 'Categories, beer to brandy' },
  { value: '45min', label: 'Average delivery time' },
  { value: '2am',  label: 'Last call, every night' },
]

export default function Stats() {
  const [ref, inView] = useInView()
  return (
    <section className={styles.stats} ref={ref}>
      <div className={styles.grid}>
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`${styles.cell} reveal ${inView ? 'in' : ''}`}
            style={{ transitionDelay: `${i * 0.08}s` }}
          >
            <span className={styles.value}>{s.value}</span>
            <span className={styles.label}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
