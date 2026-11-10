import { MessageCircle } from 'lucide-react'
import styles from './WhatsAppButton.module.css'

// Green "order/contact on WhatsApp" button. `href` comes from utils/whatsapp;
// if it's null (no number configured) the button renders disabled with a hint.
export default function WhatsAppButton({ href, label = 'Order on WhatsApp', block = false }) {
  if (!href) {
    return (
      <span className={`${styles.btn} ${styles.disabled} ${block ? styles.block : ''}`} title="WhatsApp number not configured">
        <MessageCircle size={18} /> {label}
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.btn} ${block ? styles.block : ''}`}
    >
      <MessageCircle size={18} /> {label}
    </a>
  )
}
