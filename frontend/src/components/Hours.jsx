import useInView from '../hooks/useInView'
import styles from './Hours.module.css'

const HOURS = [
  { day: 'Monday – Thursday', time: '4pm – 1am' },
  { day: 'Friday',           time: '4pm – 2am' },
  { day: 'Saturday',         time: '2pm – 2am' },
  { day: 'Sunday',           time: '2pm – 12am' },
]

// Rough "open now" check against the schedule above (local time).
function isOpenNow() {
  const now = new Date()
  const day = now.getDay() // 0 Sun .. 6 Sat
  const h = now.getHours()
  if (day === 0) return h >= 14 || h < 0
  if (day >= 1 && day <= 4) return h >= 16 || h < 1
  if (day === 5) return h >= 16 || h < 2
  if (day === 6) return h >= 14 || h < 2
  return false
}

export default function Hours() {
  const [ref, inView] = useInView()
  const open = isOpenNow()
  return (
    <section id="hours" className={styles.section} ref={ref}>
      <div className={`${styles.inner} reveal ${inView ? 'in' : ''}`}>
        <div className={styles.left}>
          <span className="kicker">Hours</span>
          <h2 className={`serif-title ${styles.title}`}>Come by, or order in</h2>
          <div className={`${styles.status} ${open ? styles.openNow : styles.closedNow}`}>
            <span className={styles.statusDot} />
            {open ? 'Open now' : 'Closed right now'}
          </div>
          <p className={styles.note}>
            Kitchen closes an hour before last call. Delivery runs until 30
            minutes before close.
          </p>
        </div>
        <ul className={styles.list}>
          {HOURS.map((h) => (
            <li className={styles.row} key={h.day}>
              <span className={styles.day}>{h.day}</span>
              <span className={styles.dots} aria-hidden="true" />
              <span className={styles.time}>{h.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
