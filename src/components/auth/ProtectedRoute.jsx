import { Navigate } from 'react-router-dom'
import useAuthStore, { hasSessionCookie } from '../../stores/authStore'

/**
 * Route guard. A user is considered authenticated only when both the store
 * flag and the session cookie are present. `role` ('admin' | 'staff') gates
 * access; mismatched roles are redirected to their own home.
 */
const ProtectedRoute = ({ role, children }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !hasSessionCookie() || !user) {
    return <Navigate to="/" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  }

  return children
}

export default ProtectedRoute
