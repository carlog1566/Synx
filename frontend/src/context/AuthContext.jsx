import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/auth'

const AuthContext = createContext(null)

/**
 * Provides app-wide authentication state and actions (login, register, Google login, logout) to
 * any component via useAuth().
 * 
 * Since auth tokens are stored as httpOnly cookies, this component can't simply read a cookie
 * to know if someone is logged in, instead it calls authAPI.me().
 */
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        /**
         * Check for an existing valid session on initial app load.
         * 
         * Runs once when the app first mounts to restore the login state from a still-valid
         * cookie left over from a previous visit. A 401 here is expected and not an error, it
         * just means that no one is currently logged in.
         */
        const checkAuth = async () => {
            try {
                const response = await authAPI.me()
                setUser(response.data)
            } catch (err) {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    /**
     * Registers a new account and logs the user in immediately, skipping a separate login
     * step.
     * 
     * @param {string} username 
     * @param {string} password 
     * @param {string} email 
     * @throws Re-throws any error (e.g. username taken, weak password, etc) so RegisterPage
     *  can display it
     */
    const register = async (username, password, email) => {
        try {
            await authAPI.register(username, password, email)
            const response = await authAPI.me()
            setUser(response.data)
        } catch (err) {
            setUser(null)
            throw err
        } finally {
            setLoading(false)
        }
    }

    /**
     * Logs a user in with username/password and updates local auth state.
     * 
     * authAPI.login() sets the cookies and returns a success message. authAPI.me() is required
     * after to actually populate 'user', since it's the only endpoint that returns user data.
     * 
     * @param {string} username 
     * @param {string} password 
     * @throws Re-throws any error from authAPI.login() so the calling component (LoginPage) can
     *  catch it and show an error message.
     */
    const login = async (username, password) => {
        try {
            await authAPI.login(username, password)
            const response = await authAPI.me()
            setUser(response.data)
        } catch (err) {
            setUser(null)
            throw err
        } finally {
            setLoading(false)
        }
    }

    /**
     * Logs a user in via Google ID token, following the same pattern as login(): the backend 
     * sets cookies, then a separate call to authAPI.me() to populate 'user'.
     * 
     * @param {string} credential - the Google ID token from the frontend's GoogleLogin button's
     *  onSuccess callback.
     * @throws Re-throws any error so the calling component can show an error message.
     */
    const googleLogin = async (credential) => {
        try {
            await authAPI.googleLogin(credential)
            const response = await authAPI.me()
            setUser(response.data)
        } catch (err) {
            setUser(null)
            throw err
        } finally {
            setLoading(false)
        }
    }

    /**
     * Clears the local 'user' state without calling the backend.
     * 
     * Used for after account deletion where calling logout() would mean an unecessary second
     * network request to re-clear cookies that are already gone.
     */
    const clearUser = () => {
        setUser(null)
    }

    /**
     * Logs the current user out by clearing their auth cookies server-side, then clearing local
     * 'user' state to match.
     */
    const logout = async () => {
        try {
            await authAPI.logout()
            setUser(null)
        } catch (err) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, register, login, googleLogin, clearUser, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

/**
 * Hook for accessing auth state and actions from any component.
 * 
 * @returns {{user: Object|null, loading: boolean, login: Function, clearUser: Function, 
 *  googleLogin: Function, register: Function, logout: Function}}
 */
const useAuth = () => {
    return useContext(AuthContext)
}


export { AuthProvider, useAuth }