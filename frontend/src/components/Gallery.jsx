import useInView from '../hooks/useInView'
import styles from './Gallery.module.css'

// Real room photography (portrait). Served from public/images/room/.
const SHOTS = [
  { src: '/images/room/shelf-warm.webp',       alt: 'Backlit bottle shelf glowing amber and red' },
  { src: '/images/room/cocktails-lineup.webp', alt: 'A line-up of garnished cocktails along the bar' },
  { src: '/images/room/cocktails-bar.webp',    alt: 'Two cocktails resting on the counter' },
  { src: '/images/room/shelf-neon.webp',       alt: 'Spirits shelf washed in blue neon light' },
]

export default function Gallery() {
  const [ref, inView] = useInView()
  return (
    <section id="gallery" className={styles.section} ref={ref}>
      <div className={styles.head}>
        <span className="kicker">The Room</span>
        <h2 className={`serif-title ${styles.title}`}>Low light, loud nights</h2>
        <p className={styles.lede}>
          Warm shelves, cold glasses and a long bar. A look inside Johnnie's Place.
        </p>
      </div>
      <div className={styles.grid}>
        {SHOTS.map((s, i) => (
          <figure
            key={s.src}
            className={`${styles.tile} reveal ${inView ? 'in' : ''}`}
            style={{ transitionDelay: `${i * 0.08}s` }}
          >
            <img src={s.src} alt={s.alt} loading="lazy" />
            <span className={styles.sheen} aria-hidden="true" />
          </figure>
        ))}
      </div>
    </section>
  )
}
