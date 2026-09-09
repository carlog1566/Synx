import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import SongListPage from './pages/SongListPage'
import SongDetailPage from './pages/SongDetailPage'
import Navbar from './components/Navbar'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function App() {
	const [menuOpen, setMenuOpen] = useState(false)
	const navRef = useRef(null)
	const location = useLocation()
	const [navHeight, setNavHeight] = useState(0)

	const isRegister = location.pathname === '/register'
    const isLogin = location.pathname === '/login'
    const forgotPassword = location.pathname === '/forgot-password'
    const resetPassword = location.pathname.startsWith('/reset-password/')
    const isAuthPage = isRegister || isLogin || forgotPassword || resetPassword

	useEffect(() => {
		if (!navRef.current) return
		const observer = new ResizeObserver(() => {
			if (navRef.current){
				setNavHeight(navRef.current.offsetHeight)
			}
		})
		observer.observe(navRef.current)
		return () => observer.disconnect()
	}, [])

	return (
		<AuthProvider>
			<div 
				className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50"
            	style={{ '--nav-height': `${navHeight}px` }}
			>
				<Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} navRef={navRef}/>

				<main 
					className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
					style={{ paddingTop: isAuthPage ? navHeight : navHeight + 32}}	
				>
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path='/songs' element={<ProtectedRoute><SongListPage /></ProtectedRoute>} />
						<Route path='/songs/:id' element={<ProtectedRoute><SongDetailPage /></ProtectedRoute>} />
						<Route path='/register' element={<RegisterPage />} />
						<Route path='/login' element={<LoginPage />} />
						<Route path='/dashboard' element={<DashboardPage />} />
						<Route path='/forgot-password/' element={<ForgotPasswordPage />} />
						<Route path='/reset-password/:uid/:token/' element={<ResetPasswordPage />} />
					</Routes>
				</main>

				<footer className="text-white py-20 w-full">
					<div className="container mx-auto px-4 text-center">
						<h3 className="text-2xl font-bold mb-2 text-gray-400">Synx</h3>
						<p className="text-gray-400 mb-6">
							AI-powered chord detection and tab generation
						</p>
						<div className="text-gray-500 text-sm">
							© 2026 Synx
						</div>
					</div>
				</footer>
			</div>
		</AuthProvider>
	)
}

export default App
