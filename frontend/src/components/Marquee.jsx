import styles from './Marquee.module.css'

const WORDS = [
  'Cold Beers', 'Rare Whisky', 'House Cocktails', 'Fine Wine',
  'Local Spirits', 'Late Nights', 'Delivered Fast',
]

export default function Marquee() {
  const row = [...WORDS, ...WORDS]
  return (
    <section className={styles.marquee} aria-hidden="true">
      <div className={styles.track}>
        {row.map((w, i) => (
          <span className={styles.item} key={i}>
            {w}
            <span className={styles.dot}>✦</span>
          </span>
        ))}
      </div>
    </section>
  )
}
