import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI } from '../services/auth'
import Success from '../components/Success'

const ResetPasswordPage = () => {    
    const { uid, token } = useParams()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setSubmitting(true)
        try {
            await authAPI.resetPassword(uid, token, newPassword)
            setSuccess(true)
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

    if (success) {
        return (
            <Success 
                title="Password reset!" 
                text="Log in with your new password" 
                path="/login" 
            />
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
                <h1 className="text-center text-3xl font-bold text-gray-800 mb-6">Reset Password</h1>

                {error && (
                    <div className="whitespace-pre-line bg-red-50 text-red-600 p-3 rounded-lg mb-4">
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
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={submitting}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                    />
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                {submitting ? 'Reseting...' : 'Reset Password'}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>
                </form>
            </motion.div>
        </div>
    )

}

export default ResetPasswordPage