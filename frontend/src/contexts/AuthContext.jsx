/**
 * Auth context — manages user login state across the app.
 */
import { createContext, useContext, useState, useEffect } from 'react'
import { getProfile } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, check if there's a stored token and load user
  useEffect(() => {
    const token = localStorage.getItem('ats_token')
    if (!token) {
      setLoading(false)
      return
    }
    getProfile()
      .then((profile) => setUser(profile))
      .catch(() => {
        localStorage.removeItem('ats_token')
        localStorage.removeItem('ats_user')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('ats_token', token)
    localStorage.setItem('ats_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('ats_token')
    localStorage.removeItem('ats_user')
    setUser(null)
  }

  // Listen for session-expired events from the API interceptor
  useEffect(() => {
    const handleExpired = () => logout()
    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
