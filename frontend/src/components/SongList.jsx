import { songAPI } from '../services/api'
import { useState, useEffect } from 'react'
import ChordDisplay from './ChordDisplay';
import AddSongForm from './AddSongForm'

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    const paddedSecs = secs.toString().padStart(2, '0');
    
    return `${mins}:${paddedSecs}`;
}

const SongList = () => {
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
                        <div 
                            key={song.id} 
                            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200"
                        >
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
                                <h3 className="text-xl font-bold mb-1 truncate">{song.title}</h3>
                                <p className="text-white/80 text-sm">{song.artist}</p>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 space-y-4">
                                {/* Duration */}
                                {song.duration > 0 && (
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {formatDuration(song.duration)}
                                    </div>
                                )}

                                {/* Audio File Indicator */}
                                {song.audio_file && (
                                    <div className="flex items-center text-primary text-sm font-medium">
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                                        </svg>
                                        Audio file uploaded
                                    </div>
                                )}

                                {/* Analyzing Status */}
                                {analyzingId === song.id && (
                                    <div className="flex items-center text-primary bg-blue-50 px-3 py-2 rounded-lg">
                                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyzing chords...
                                    </div>
                                )}

                                {/* Success Status */}
                                {song.analyzed && !analyzingId && (
                                    <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Analysis complete
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    {/* Retry Button */}
                                    {song.analysis_failed && (
                                        <button 
                                            onClick={() => handleAnalyze(song.id)} 
                                            disabled={analyzingId === song.id}
                                            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {analyzingId === song.id ? 'Analyzing...' : 'Analysis Failed - Retry'}
                                        </button>
                                    )}

                                    {/* Analyze Button */}
                                    {song.audio_file && !song.analyzed && !song.analysis_failed && analyzingId !== song.id && (
                                        <button 
                                            onClick={() => handleAnalyze(song.id)}
                                            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                            </svg>
                                            Analyze Chords
                                        </button>
                                    )}
                                </div>

                                {/* Chord Display */}
                                {song.chords && <ChordDisplay chords={song.chords} />}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    )
} 

export default SongList