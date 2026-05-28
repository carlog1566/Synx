import { Routes, Route } from 'react-router'
import HomePage from './pages/HomePage'
import SongListPage from './pages/SongListPage'
import SongDetailPage from './pages/SongDetailPage'
import Navbar from './components/Navbar'

function App() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-36">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path='/songs' element={<SongListPage />} />
          <Route path='/songs/:id' element={<SongDetailPage />} />
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
  )
}

export default App
