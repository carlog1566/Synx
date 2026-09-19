import { Navigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

/**
 * Guards a route, redirecting to /login if no authenticated user exists.
 * 
 * Waits for AuthContext's initial checkAuth() to resolve (loading) before deciding whether
 * to redirect.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - the protected content to render if the user is 
 *  authenticated.
 * @returns {React.ReactNode} children if authenticated, a redirect to /login if not, or
 *  null while auth status is still loading.
 */
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return null
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default ProtectedRoute