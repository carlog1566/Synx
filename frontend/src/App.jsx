import { useState, useEffect } from 'react'
import './App.css'
import { songAPI } from './services/api'
import SongList from './components/SongList'
import AddSongForm from './components/AddSongForm'

function App() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
          <SongList songs={songs} />
        </div>
      )} 
    </div>
  )
}

export default App
