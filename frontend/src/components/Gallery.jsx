import useInView from '../hooks/useInView'
import styles from './Gallery.module.css'

// Real photos of the bar. Served from public/images/room/.
const SHOTS = [
  { src: '/images/room/bar-counter.webp', alt: 'The bar counter and backlit bottle shelf under the BAR marquee' },
  { src: '/images/room/room-wide.webp',   alt: 'The room — long tables, bar stools and the Tanzanian flag' },
  { src: '/images/room/mural.webp',       alt: 'Hand-painted mural of a lively bar on the wall' },
  { src: '/images/room/bar-shelf.webp',   alt: 'Spirits and wines on the shelf beside the Pepsi fridge' },
  { src: '/images/room/room-tables.webp', alt: 'Wooden tables and high stools across the room' },
  { src: '/images/room/bar-stools.webp',  alt: 'Mint bar stools along the granite counter' },
]

export default function Gallery() {
  const [ref, inView] = useInView()
  return (
    <section id="gallery" className={styles.section} ref={ref}>
      <div className={styles.head}>
        <span className="kicker">The Room</span>
        <h2 className={`serif-title ${styles.title}`}>Low light, loud nights</h2>
        <p className={styles.lede}>
          A neighbourhood bar in Zanzibar — cold fridges, a long granite counter and a wall
          worth a photo. Come as you are.
        </p>
      </div>
      <div className={styles.grid}>
        {SHOTS.map((s, i) => (
          <figure
            key={s.src}
            className={`${styles.tile} reveal ${inView ? 'in' : ''}`}
            style={{ transitionDelay: `${i * 0.07}s` }}
          >
            <img src={s.src} alt={s.alt} loading="lazy" />
            <span className={styles.sheen} aria-hidden="true" />
          </figure>
        ))}
      </div>
    </section>
  )
}
