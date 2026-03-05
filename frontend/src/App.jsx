import { useState, useEffect } from 'react'
import './App.css'
import { songAPI } from './services/api'
import SongList from './components/SongList'
import AddSongForm from './components/AddSongForm'

function App() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)

  useEffect(() => {
    fetchSongs()
  }, [])

  const fetchSongs = async() => {
    try {
      const response = await songAPI.getAll()
      setSongs(response.data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleAnalyze = async (songId) => {
    console.log('Analyzing song:', songId)
    setAnalyzingId(songId)

    setSongs(prevSongs => prevSongs.map(song => 
      song.id === songId ? {...song, analysis_failed: false} : song
    ))

    try {
      const response = await songAPI.analyze(songId)
      const updatedSong = response.data
      setSongs(prevSongs => prevSongs.map(song =>
        song.id === songId ? updatedSong : song
      ))
    } catch (err) {
      setError(err.message)
      setSongs(prevSongs => prevSongs.map(song =>
        song.id === songId ? {...song, analysis_failed: true} : song
      ))
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleSongAdded = async (newSong) => {
    setSongs(prevSongs => [newSong, ...prevSongs])

    if (newSong.audio_file) {
      handleAnalyze(newSong.id)
    }
  }

  if (loading) {
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800">Loading...</h1>
        </div>
      </div>
  }

  if (error) {
    return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Error!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
  )}

  return (
    <div className="min-h-screen bg-gray-900 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Synx
              </h1>
              <p className="text-gray-600 mt-1">Your AI-powered music companion</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Song Form */}
        <div className="mb-8">
          <AddSongForm onSongAdded={handleSongAdded} />
        </div>

        {/* Song List */}
        {songs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No songs yet!</h2>
            <p className="text-gray-500">Upload your first song to get started.</p>
          </div>
        ) : (
          <SongList 
            songs={songs} 
            onAnalyze={handleAnalyze} 
            analyzingId={analyzingId}
          />
        )}
      </main>
    </div>
  )
}

export default App
