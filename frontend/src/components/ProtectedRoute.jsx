/**
 * ProtectedRoute — wraps pages that require authentication.
 * Waits for AuthContext.loading to finish before deciding to redirect,
 * preventing the flash-of-content race condition.
 *
 * Props:
 *   adminOnly – if true, also requires user.is_admin
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (adminOnly && !user.is_admin) {
    return <Navigate to="/" replace />
  }

  return children
}
