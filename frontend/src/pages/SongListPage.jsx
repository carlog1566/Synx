import { songAPI } from '../services/api'
import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import ChordDisplay from '../components/ChordDisplay'
import AddSongForm from '../components/AddSongForm'
import Song from '../components/Song'
import Loading from '../components/Loading'
import Error from '../components/Error'

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    const paddedSecs = secs.toString().padStart(2, '0');
    
    return `${mins}:${paddedSecs}`;
}

/**
 * Displays the user's song library as a grid, with an upload form above it. Handles chord analysis
 * triggering and its resulting states (in-progress, failed) for each song independently.
 */
const SongListPage = () => {
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [analyzingIds, setAnalyzingIds] = useState([])

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

    /**
     * Analyzes or re-analyzes a song. Tracked in analyzingIds (list) since multiple songs can be
     * analyzing simultaneously, using a list lets each Song card independently show its own spinner
     * without affecting others.
     */
    const handleAnalyze = async (songId) => {
        console.log('Analyzing song:', songId)
        setAnalyzingIds(prev => [...prev, songId])

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
            setAnalyzingIds(prev => prev.filter(id => id !== songId))
        }
    }

    /**
     * Adds a newly uploaded song to the list immediately, then kicks off analysis automatically if
     * it has an audio file, skips requiring a separate manual "Analyze" click after upload.
     */
    const handleSongAdded = async (newSong) => {
        setSongs(prevSongs => [newSong, ...prevSongs])

        if (newSong.audio_file) {
            handleAnalyze(newSong.id)
        }
    }

    if (loading) {
        return (
            <Loading />
        )
    }

    if (error) {
        return (
            <Error error={error} />
        )
    }


    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                ease: 'easeOut'
            }}
        >
            <div className="mb-8">
                    <AddSongForm onSongAdded={handleSongAdded} />
            </div>

            {/* Song Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center col-span-full text-center py-16">
                        <div className="text-6xl mb-4">🎵</div>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                            No songs yet!
                        </h2>
                        <p className="text-gray-500">
                            Upload your first song to get started.
                        </p>
                    </div>
                ) : (      
                    songs.map((song) => (
                        <Song 
                            key={song.id} 
                            song={song} 
                            analyzingIds={analyzingIds} 
                            handleAnalyze={handleAnalyze} 
                            formatDuration={formatDuration}
                        />
                    )
                ))}
            </div>
        </motion.div>
    )
} 

export default SongListPage