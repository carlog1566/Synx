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

    try {
      const response = await songAPI.analyze(songId)
      const updatedSong = response.data
      setSongs(songs.map(song =>
        song.id === songId ? updatedSong : song
      ))
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzingId(null)
    }
  }

  if (loading) {
    return <div className="App"><h1>Loading...</h1></div>
  }

  if (error) {
    return <div className="App">
      <h1>Error!</h1>
      <p>{error}</p>
    </div>
  }

  return (
    <div className="App">
      <h1>Synx</h1>
      {songs.length === 0 ? (
        <p>No songs yet. Add one!</p>
      ) : (
        <div>
          <AddSongForm onSongAdded={fetchSongs} />
          <SongList songs={songs} onAnalyze={handleAnalyze} analyzingId={analyzingId}/>
        </div>
      )} 
    </div>
  )
}

export default App
