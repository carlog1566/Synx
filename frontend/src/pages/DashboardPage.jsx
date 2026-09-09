import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/auth'

const DashboardPage = () => {
    const [stats, setStats] = useState(null)

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState(null)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteError, setDeleteError] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const { user, logout } = useAuth()
    const navigate = useNavigate()

    useEffect (() => {
        const fetchStats = async() => {
            try {
                const response = await authAPI.getStats()
                setStats(response.data)
            } catch (err) {

            }
        }
        fetchStats()
    }, [])

    const handleLogout = async () => {
        try {
            await logout()
        } catch (err) {

        } finally {
            navigate('/')
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setPasswordError(null)
        setPasswordSuccess(false)
        setChangingPassword(true)

        try {
            await authAPI.changePassword(currentPassword, newPassword, confirmPassword)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setPasswordSuccess(true)
        } catch (err) {
            const backendError = err.response?.data?.error
            if (Array.isArray(backendError) || backendError) {
                setPasswordError(backendError)
            } else {
                setPasswordError('Something went wrong. Please try again.')
            }
        } finally {
            setChangingPassword(false)
        }
    }

    const handleDeleteAccount = async () => {
        setDeleteError(null)
        setDeleting(true)

        try {
            await authAPI.deleteAccount(deletePassword, deleteConfirmation)
            navigate('/')
        } catch (err) {
            const backendError = err.response?.data?.error
            setDeleteError(backendError || 'Something went wrong. Please try again.')
        } finally {
            setDeleting(false)
        }
    }

    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        return new Date(dateString).toLocaleDateString('en-US', options)
    }

    if (!user) {
        return null
    }

    return (
         <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                ease: 'easeOut'
            }}
            className="max-w-2xl mx-auto mb-8 space-y-8"
        >
            <h1 className="text-3xl font-bold text-gray-800">Your Account</h1>

            {/* Username & Email Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Profile</h2>
                <div className="space-y-2 text-gray-600">
                    <p><span className="font-medium text-gray-800">Username:</span> {user.username}</p>
                    <p><span className="font-medium text-gray-800">Email:</span> {user.email}</p>
                </div>
                <motion.button
                    onClick={handleLogout}
                    className="border-1 border-red-600 text-red-600 font-medium mt-3 py-2 px-6 rounded-lg cursor-pointer transition"
                    whileHover={{ backgroundColor: 'rgb(220, 38, 38)', color: 'white'}}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                    Sign Out
                </motion.button>
            </div>

            {/* Change Password Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    {user.has_password ? 'Change Password' : 'Set Password'}
                </h2>

                {passwordError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                        <ul className="list-disc pl-5">
                            {Array.isArray(passwordError) ? (
                                passwordError.map((msg, i) => <li key={i}>{msg}</li>)
                            ) : (
                                <li>{passwordError}</li>
                            )}
                        </ul>
                    </div>
                )}
                {passwordSuccess && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">
                        {user.has_password
                            ? 'Password changed successfully!'
                            : 'Password created successfully!'
                        }
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                    {user.has_password && (
                        <input
                            type="password"
                            placeholder="Current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={changingPassword}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                        />
                    )}
                    <input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={changingPassword}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                    />
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={changingPassword}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                    />
                    
                    <motion.button
                        type="submit"
                        disabled={changingPassword}
                        className="bg-purple-600 text-white font-medium py-2 px-6 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                        animate={{
                            backgroundColor: changingPassword ? '#A98AD1' : '#845BB3'
                        }}
                        whileHover={!changingPassword ? { scale: 1.02, boxShadow: '0px 8px 20px rgba(0,0,0,0.2)' } : {}}
                        whileTap={!changingPassword ? { scale: 0.98 } : {}}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={changingPassword ? 'loading' : 'idle'}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="inline-block"
                            >
                                {changingPassword ? (
                                    user.has_password ? 'Changing...' : 'Setting...'
                                ) : (
                                    user.has_password ? 'Change Password' : 'Set Password'
                                )}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>
                </form>
            </div>

            {/* Account Created Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Account Details</h2>
                <p className="text-gray-600">
                    Member since: {formatDate(user.date_joined)}
                </p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Library</h2>
                {stats ? (
                    <div className="flex gap-8">
                        <div>
                            <p className="text-3xl font-bold text-primary">{stats.total_songs}</p>
                            <p className="text-gray-500 text-sm">Total songs</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-primary">{stats.analyzed_songs}</p>
                            <p className="text-gray-500 text-sm">Analyzed</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-400">Loading...</p>
                )}
            </div>

            {/* Delete Account Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-red-100">
                <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>

                {!showDeleteConfirm ? (
                    <motion.button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-red-600 cursor-pointer disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02, boxShadow: '0px 8px 20px rgba(0,0,0,0.2)' }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        Delete Account
                    </motion.button>
                ) : (
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            This will PERMANENTLY DELETE your account and all your songs. 
                            This CANNOT be undone.
                        </p>

                        {deleteError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                                {deleteError}
                            </div>
                        )}

                        {user.has_password ? (
                            <input
                                type="password"
                                placeholder="Enter your password to confirm"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                disabled={deleting}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                            />
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    Type <span className="font-bold text-red-600">DELETE</span> to confirm.
                                </p>

                                <input
                                    type="text"
                                    placeholder="DELETE"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    disabled={deleting}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <motion.button
                                onClick={handleDeleteAccount}
                                disabled={ deleting || (user.has_password ? !deletePassword : deleteConfirmation !== 'DELETE') }
                                className="bg-red-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                whileHover={{ scale: 1.02, boxShadow: '0px 8px 20px rgba(0,0,0,0.2)' }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                {deleting ? 'Deleting...' : 'Permanently Delete'}
                            </motion.button>
                            <motion.button
                                onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setDeletePassword('')
                                    setDeleteConfirmation('')
                                    setDeleteError(null)
                                }}
                                disabled={deleting}
                                className="bg-gray-200 text-gray-700 font-medium py-2 px-6 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                whileHover={{ scale: 1.02, boxShadow: '0px 8px 20px rgba(0,0,0,0.2)' }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                Cancel
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export default DashboardPage