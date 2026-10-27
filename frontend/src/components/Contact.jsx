import { MapPin, Phone, Mail } from 'lucide-react'
import { BRAND } from '../config'
import useInView from '../hooks/useInView'
import styles from './Contact.module.css'

export default function Contact() {
  const [ref, inView] = useInView()
  return (
    <section id="contact" className={styles.section} ref={ref}>
      <div className={`${styles.inner} reveal ${inView ? 'in' : ''}`}>
        <div className={styles.left}>
          <span className="kicker">Visit</span>
          <h2 className={`serif-title ${styles.title}`}>Find the door</h2>
          <p className={styles.text}>
            Tucked off the main road in Oyster Bay. Look for the amber glow and
            the small brass sign.
          </p>
          <ul className={styles.details}>
            <li className={styles.detail}>
              <MapPin size={18} className={styles.icon} />
              <span>{BRAND.address}, {BRAND.city}</span>
            </li>
            <li className={styles.detail}>
              <Phone size={18} className={styles.icon} />
              <a href={`tel:${BRAND.phone.replace(/\s+/g, '')}`}>{BRAND.phone}</a>
            </li>
            <li className={styles.detail}>
              <Mail size={18} className={styles.icon} />
              <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
            </li>
          </ul>
        </div>
        <div className={styles.mapCard} aria-hidden="true">
          <div className={styles.mapGlow} />
          <span className={styles.pin}><MapPin size={28} /></span>
          <span className={styles.mapLabel}>{BRAND.name}</span>
        </div>
      </div>
    </section>
  )
}
