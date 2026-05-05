import { Routes, Route } from 'react-router'
import HomePage from './pages/HomePage'
import SongList from './components/SongList'
import Navbar from './components/Navbar'

function App() {

  return (
    <div className="min-h-screen bg-gray-900 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-36">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path='/songs' element={<SongList />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
