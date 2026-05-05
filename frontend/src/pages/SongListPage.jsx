import { songAPI } from '../services/api'
import { useState, useEffect } from 'react'
import ChordDisplay from '../components/ChordDisplay'
import AddSongForm from '../components/AddSongForm'
import Song from '../components/Song'
import { Link } from 'react-router'

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    const paddedSecs = secs.toString().padStart(2, '0');
    
    return `${mins}:${paddedSecs}`;
}

const SongListPage = () => {
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [analyzingId, setAnalyzingId] = useState(null)

    useEffect(() => {
        fetchSongs()
    }, [])

    const fetchSongs = async () => {
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
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-800">Loading...</h1>
                </div>
            </div>
        )
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
        <div>
            <div className="mb-8">
                    <AddSongForm onSongAdded={handleSongAdded} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center col-span-full text-center py-16">
                        <div className="text-6xl mb-4">🎵</div>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No songs yet!</h2>
                        <p className="text-gray-500">Upload your first song to get started.</p>
                    </div>
                ) : (      
                    songs.map((song) => (
                        <Link key={song.id} to={`${song.id}`}>
                            <Song song={song} analyzingId={analyzingId} handleAnalyze={handleAnalyze} formatDuration={formatDuration} />
                        </Link>
                    )
                ))}
            </div>
        </div>
    )
} 

export default SongListPage