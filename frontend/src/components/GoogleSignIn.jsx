import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID } from '../config'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

// Loads the Google Identity Services script once and resolves when ready.
let gsiPromise = null
function loadGsi() {
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google)
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve(window.google)
    s.onerror = () => reject(new Error('Failed to load Google Sign-In'))
    document.head.appendChild(s)
  })
  return gsiPromise
}

// Renders Google's official "Sign in with Google" button. `onCredential` receives
// the returned ID token (same flow for login and signup). Shows a clear note when
// no client ID is configured.
export default function GoogleSignIn({ onCredential, onError, text = 'continue_with' }) {
  const holder = useRef(null)
  const [status, setStatus] = useState(GOOGLE_CLIENT_ID ? 'loading' : 'unconfigured')
  // Keep the latest callbacks without re-initialising GSI.
  const cbRef = useRef({ onCredential, onError })
  cbRef.current = { onCredential, onError }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false

    loadGsi()
      .then((google) => {
        if (cancelled || !holder.current) return
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => {
            if (resp?.credential) cbRef.current.onCredential?.(resp.credential)
            else cbRef.current.onError?.(new Error('No credential returned'))
          },
        })
        holder.current.innerHTML = ''
        google.accounts.id.renderButton(holder.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text,
          width: 280,
        })
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        cbRef.current.onError?.(err)
      })

    return () => { cancelled = true }
  }, [text])

  if (status === 'unconfigured') {
    return (
      <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', maxWidth: '34ch', textAlign: 'center' }}>
        Google sign-in isn't configured yet. Add a <code>VITE_GOOGLE_CLIENT_ID</code> to
        the frontend <code>.env.local</code> (and <code>GOOGLE_CLIENT_ID</code> on the API).
      </p>
    )
  }

  return (
    <div>
      <div ref={holder} style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />
      {status === 'loading' && (
        <p style={{ fontSize: '.8rem', color: 'var(--text-faint)', textAlign: 'center' }}>Loading Google…</p>
      )}
      {status === 'error' && (
        <p style={{ fontSize: '.8rem', color: '#d4766a', textAlign: 'center' }}>Couldn't load Google Sign-In.</p>
      )}
    </div>
  )
}
