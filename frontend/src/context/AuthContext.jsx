import { createContext, useState, useEffect, useCallback } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [sessionToken, setSessionToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored session token
    const token = localStorage.getItem('sessionToken')
    if (token) {
      setSessionToken(token)
      // Verify token is still valid
      fetch('/api/auth/session', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.user) {
            setUser(data.user)
          } else {
            localStorage.removeItem('sessionToken')
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const signUp = useCallback(async (email, password, name) => {
    const res = await fetch('/api/auth/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error)
    }

    const data = await res.json()
    setUser(data.user)
    setSessionToken(data.sessionToken)
    localStorage.setItem('sessionToken', data.sessionToken)
    return data.user
  }, [])

  const signIn = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error)
    }

    const data = await res.json()
    setUser(data.user)
    setSessionToken(data.sessionToken)
    localStorage.setItem('sessionToken', data.sessionToken)
    return data.user
  }, [])

  const signOut = useCallback(async () => {
    if (sessionToken) {
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` }
      })
    }
    setUser(null)
    setSessionToken(null)
    localStorage.removeItem('sessionToken')
  }, [sessionToken])

  const value = {
    user,
    sessionToken,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
