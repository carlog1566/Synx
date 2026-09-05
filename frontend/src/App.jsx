import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import SongListPage from './pages/SongListPage'
import SongDetailPage from './pages/SongDetailPage'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  const forgotPassword = location.pathname === '/forgot-password'
  const resetPassword = location.pathname.startsWith('/reset-password/')
  const paddingClass =  ((isLogin || forgotPassword || resetPassword) && menuOpen) ? 'pt-72 py-8' : menuOpen ? 'pt-88 py-8' : (isLogin || forgotPassword || resetPassword) ? 'pt-0 py-0' : 'pt-16 md:py-36'

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>

        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-[padding] duration-400 ease-in-out ${paddingClass}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path='/songs' element={<SongListPage />} />
            <Route path='/songs/:id' element={<SongDetailPage />} />
            <Route path='/login' element={<LoginPage />} />
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
