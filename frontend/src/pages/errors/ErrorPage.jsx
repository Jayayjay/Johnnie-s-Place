import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { GlassWater, ServerCrash, Lock } from 'lucide-react'
import { BRAND } from '../../config'
import styles from './ErrorPage.module.css'

const ERRORS = {
  400: { headline: 'Bad Request',        name: 'Bad Request',           desc: 'The order was malformed or missing a few details.',        cat: '4XX', catLabel: 'CLIENT ERROR', color: '#d99a3a', rgb: '217,154,58' },
  401: { headline: 'Members Only',       name: 'Unauthorized',          desc: 'Sign in to continue — this corner is for the regulars.',   cat: '4XX', catLabel: 'AUTH ERROR',   color: '#6aa6d6', rgb: '106,166,214' },
  403: { headline: 'No Entry',           name: 'Forbidden',             desc: "You don't have the key to this room.",                     cat: '4XX', catLabel: 'AUTH ERROR',   color: '#6aa6d6', rgb: '106,166,214' },
  404: { headline: 'Last Call',          name: 'Not Found',             desc: "This page poured out. Nothing left on the shelf here.",    cat: '4XX', catLabel: 'CLIENT ERROR', color: '#d99a3a', rgb: '217,154,58' },
  500: { headline: 'We Spilled One',     name: 'Internal Server Error', desc: "Something broke behind the bar. We're mopping up.",        cat: '5XX', catLabel: 'SERVER ERROR', color: '#c05a3a', rgb: '192,90,58'  },
  502: { headline: 'Bad Gateway',        name: 'Bad Gateway',           desc: 'The upstream supplier is unreachable right now.',          cat: '5XX', catLabel: 'SERVER ERROR', color: '#c05a3a', rgb: '192,90,58'  },
  503: { headline: 'Closed for Now',     name: 'Service Unavailable',   desc: "We're briefly closed for restocking. Back shortly.",       cat: '5XX', catLabel: 'SERVER ERROR', color: '#c05a3a', rgb: '192,90,58'  },
  504: { headline: 'Order Timed Out',    name: 'Gateway Timeout',       desc: 'The kitchen took too long to respond. Try again.',         cat: '5XX', catLabel: 'SERVER ERROR', color: '#c05a3a', rgb: '192,90,58'  },
}

function getIcon(code) {
  if (code === 401 || code === 403) return <Lock size={26} strokeWidth={1.5} />
  if (code >= 500) return <ServerCrash size={26} strokeWidth={1.5} />
  return <GlassWater size={26} strokeWidth={1.5} />
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 22 } },
}

function toHex(color, opacity) {
  return color + Math.round(opacity * 255).toString(16).padStart(2, '0')
}

export default function ErrorPage({ code = 404 }) {
  const err = ERRORS[code] ?? ERRORS[404]
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />
      <span className={styles.watermark} aria-hidden="true">{code}</span>

      <header className={styles.topBar}>
        <Link to="/" className={styles.wordmark}>
          <span className={styles.glyph}>J</span>
          <span className={styles.logotype}>Johnnie's <em>Place</em></span>
        </Link>
        <div
          className={styles.badge}
          style={{ color: err.color, borderColor: toHex(err.color, 0.28), backgroundColor: toHex(err.color, 0.07) }}
        >
          {err.cat} · {err.catLabel}
        </div>
      </header>

      <motion.main className={styles.center} variants={container} initial="hidden" animate="show" role="main">
        <motion.div variants={item}>
          <div
            className={styles.iconCircle}
            style={{ color: err.color, borderColor: toHex(err.color, 0.25), backgroundColor: toHex(err.color, 0.06), '--pulse-rgb': err.rgb }}
          >
            {getIcon(code)}
          </div>
        </motion.div>

        <motion.div variants={item}>
          <span className={styles.code} style={{ color: err.color }}>{code}</span>
        </motion.div>

        <motion.div variants={item} className={styles.rule} aria-hidden="true" />
        <motion.h1 variants={item} className={styles.headline}>{err.headline}</motion.h1>
        <motion.p variants={item} className={styles.statusName}>HTTP {code} — {err.name}</motion.p>
        <motion.p variants={item} className={styles.desc}>{err.desc}</motion.p>

        <motion.div variants={item} className={styles.actions}>
          <button className={styles.btnPrimary} style={{ backgroundColor: err.color }} onClick={() => navigate(-1)}>
            Go Back
          </button>
          <Link to="/" className={styles.btnGhost}>Return Home</Link>
        </motion.div>
      </motion.main>

      <footer className={styles.foot}>{BRAND.name} · {code} {err.name}</footer>
    </div>
  )
}
