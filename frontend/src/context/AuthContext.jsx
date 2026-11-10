import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setAuthToken } from '../services/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'johnnies-auth-v1'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  // session = { token, user } or null
  const [session, setSession] = useState(loadInitial)

  // Keep the api client's token header in sync with the session.
  useEffect(() => {
    setAuthToken(session?.token || null)
  }, [session])

  const persist = useCallback((next) => {
    setSession(next)
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable — session stays in memory */
    }
  }, [])

  // Exchange a Google credential (ID token) for an API token + user.
  const loginWithGoogle = useCallback(async (credential) => {
    const data = await api.googleAuth(credential)
    const { token, ...user } = data
    persist({ token, user })
    return user
  }, [persist])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      /* token may already be gone server-side; clear locally regardless */
    }
    persist(null)
  }, [persist])

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || null,
    isAuthenticated: !!session?.token,
    loginWithGoogle,
    logout,
  }), [session, loginWithGoogle, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
