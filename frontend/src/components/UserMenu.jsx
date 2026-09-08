import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { FiUser } from "react-icons/fi";

const UserMenu = () => {
    const [open, setOpen] = useState(false)
    const menuRef = useRef(null)
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        setOpen(false)
        try {
            await logout()
        } catch (err) {

        } finally {
            navigate('/')
        }
    }

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-third text-white font-bold cursor-pointer hover:shadow-lg transition-all duration-200"
            >
                <FiUser />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                    >
                        <div className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100">
                            Logged In: {user.username}
                        </div>
                        <Link
                            to="/songs"
                            onClick={() => setOpen(false)}
                            className="block px-4 py-3 text-sm font-medium text-primary hover:bg-gray-50 transition-colors"
                        >
                            Dashboard
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Sign Out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default UserMenu