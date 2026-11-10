import { useEffect } from 'react'
import { X, Phone } from 'lucide-react'
import WhatsAppButton from './WhatsAppButton'
import { whatsappOrderLink } from '../utils/whatsapp'
import { BRAND } from '../config'
import { formatTZS } from '../utils/format'
import styles from './ContactBarModal.module.css'

// Popup that offers to reach the bar directly (WhatsApp / phone). Used when an
// order can't go through online checkout — e.g. it's below the delivery minimum.
export default function ContactBarModal({ open, onClose, items = [], subtotal = 0, title, message }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const waLink = whatsappOrderLink(items, subtotal, "It's below the online minimum — can you help?")
  const telLink = `tel:${BRAND.phone.replace(/\s+/g, '')}`

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Contact the bar">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <span className={styles.glyph}>J</span>
        <h2 className={styles.title}>{title || 'Order straight from the bar'}</h2>
        <p className={styles.message}>
          {message || `Online delivery starts at ${formatTZS(50000)}. For smaller orders, just reach us directly and we'll sort it out.`}
        </p>

        <div className={styles.actions}>
          <WhatsAppButton href={waLink} label="Message on WhatsApp" block />
          <a href={telLink} className={styles.call}>
            <Phone size={18} /> Call {BRAND.phone}
          </a>
        </div>

        <button className={styles.dismiss} onClick={onClose}>Keep shopping</button>
      </div>
    </div>
  )
}
