import { Link } from 'react-router-dom'
import { Truck, Clock, ShieldCheck } from 'lucide-react'
import useInView from '../hooks/useInView'
import styles from './DeliveryBanner.module.css'

const POINTS = [
  { Icon: Truck,       title: 'To your door',    text: 'City-wide delivery across Dar es Salaam, nightly.' },
  { Icon: Clock,       title: 'In ~45 minutes',  text: 'Cold and sealed, from our shelf to your place.' },
  { Icon: ShieldCheck, title: 'Pay on delivery', text: 'Cash or mobile money when your order arrives.' },
]

export default function DeliveryBanner() {
  const [ref, inView] = useInView()
  return (
    <section className={styles.section} ref={ref}>
      <div className={`${styles.panel} reveal ${inView ? 'in' : ''}`}>
        <div className={styles.copy}>
          <span className="kicker">Delivery</span>
          <h2 className={`serif-title ${styles.title}`}>
            Too comfortable to come in? <em>We'll come to you.</em>
          </h2>
          <p className={styles.text}>
            Build a cart from the full shelf and we'll bring it over — beers,
            spirits, wine and mixers, same night.
          </p>
          <Link to="/menu" className="btn btn-primary">Start an Order</Link>
        </div>
        <ul className={styles.points}>
          {POINTS.map(({ Icon, title, text }) => (
            <li className={styles.point} key={title}>
              <span className={styles.icon}><Icon size={20} strokeWidth={1.75} /></span>
              <div>
                <h3 className={styles.pointTitle}>{title}</h3>
                <p className={styles.pointText}>{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
