import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import GoogleSignIn from '../components/GoogleSignIn'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../services/api'
import { BRAND } from '../config'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Return to wherever the user came from (e.g. checkout), else home.
  const redirectTo = location.state?.from || '/'

  async function onCredential(credential) {
    setError('')
    setBusy(true)
    try {
      await loginWithGoogle(credential)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed. Try again.')
      setBusy(false)
    }
  }

  return (
    <>
      <Nav />
      <main className="app-page">
        <div className={styles.wrap}>
          <div className={styles.card}>
            <span className={styles.glyph}>J</span>
            <h1 className={`serif-title ${styles.title}`}>Welcome to {BRAND.name}</h1>
            <p className={styles.sub}>
              Sign in or create an account to check out faster and keep tabs on your orders.
            </p>

            <div className={styles.signin}>
              {busy ? (
                <p className={styles.busy}>Signing you in…</p>
              ) : (
                <GoogleSignIn onCredential={onCredential} onError={() => setError('Google Sign-In unavailable.')} text="continue_with" />
              )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <p className={styles.note}>
              <ShieldCheck size={14} /> One tap with Google — no password to remember. New here? The
              same button creates your account.
            </p>
          </div>

          <Link to="/" className={styles.back}>← Back to the bar</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
