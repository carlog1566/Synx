import { useState } from 'react'
import { Routes, Route } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import SongListPage from './pages/SongListPage'
import SongDetailPage from './pages/SongDetailPage'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>

        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-[padding] duration-400 ease-in-out ${menuOpen ? 'pt-88' : 'pt-16 md:py-36'}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path='/songs' element={<SongListPage />} />
            <Route path='/songs/:id' element={<SongDetailPage />} />
            <Route path='/login' element={<LoginPage />} />
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
