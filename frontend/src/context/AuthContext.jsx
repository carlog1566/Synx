import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/auth'

const AuthContext = createContext(null)

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
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
        <AuthContext.Provider value={{ user, loading, register, login, googleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    )
}


const useAuth = () => {
    return useContext(AuthContext)
}


export { AuthProvider, useAuth }