import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'

const RegisterPage = () => {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const { register, googleLogin } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)

        try {
            await register(username, password, email)
            navigate('/songs')
        } catch (err) {
            const backendError = err.response?.data?.error
            if (Array.isArray(backendError) || backendError) {
                setError(backendError)
            } else {
                setError('Something went wrong. Please try again.')
            }
        } finally {
            setSubmitting(false)
        }
    }


    return (
        <div className="min-h-screen md:pt-0 pt-20 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full"
            >
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                    Sign Up
                </h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                        <ul className="list-disc pl-5 text-red-500">
                            {Array.isArray(error) ? (
                                error.map((message, index) => (
                                    <li key={index}>{message}</li>
                                ))
                            ) : (
                                <li>{error}</li>
                            )}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={submitting}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={submitting}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitting}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                    />
                    <motion.button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-purple-600 text-white font-medium py-2 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                        animate={{ backgroundColor: submitting ? '#A98AD1' : '#845BB3' }}
                        whileHover={!submitting ? { scale: 1.02, boxShadow: '0px 8px 20px rgba(0,0,0,0.2)' } : {}}
                        whileTap={!submitting ? { scale: 0.98 } : {}}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={submitting ? 'loading' : 'idle'}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="inline-block"
                            >
                                {submitting ? 'Creating account...' : 'Sign Up'}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>
                </form>

                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-gray-400 text-sm">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                        try {
                            await googleLogin(credentialResponse.credential)
                            navigate('/songs')
                        } catch (err) {
                            setError('Google login failed')
                        }
                    }}
                    onError={() => setError('Google login failed')}
                    shape="pill"
                    size="large"
                    text="continue_with"
                />

                <p className="mt-4 text-center text-gray-600">
                    Already have an account? <Link to="/login" className="text-primary hover:text-third transition-colors duration-200">Log in</Link>
                </p>
            </motion.div>
        </div>
    )
}

export default RegisterPage