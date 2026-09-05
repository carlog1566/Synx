import { useState } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI } from '../services/auth'

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        
        try {
            await authAPI.forgotPassword(email)
        } catch (err) {
            setError('Something went wrong. Please check your connection and try again.')
        } finally {
            setSubmitted(true)
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Check your email</h1>
                    <p className="text-gray-600">
                        If an account exists for that email, we've sent a password reset link.
                    </p>
                    <Link to="/login" className="mt-6 inline-block text-primary hover:text-third transition-colors duration-200">
                        Back to login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.4,
                    ease: 'easeOut'
                }}
                className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full"
            >
                <h1 className="text-center text-3xl font-bold text-gray-800 mb-6">Forgot Password</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={submitting}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                    />
                    <motion.button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-purple-600 text-white font-medium py-2 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                        animate={{
                            backgroundColor: submitting ? '#A98AD1' : '#845BB3'
                        }}
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
                                {submitting ? 'Sending...' : 'Send Reset Link'}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>
                </form>
                <p className="mt-4 text-center text-gray-600">
                    <Link to="/login" className="text-primary hover:text-third transition-colors duration-200">Back to login</Link>
                </p>
            </motion.div>
        </div>
    )
}

export default ForgotPasswordPage