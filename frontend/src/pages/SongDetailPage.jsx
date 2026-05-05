import { songAPI } from "../services/api";
import { Link, useParams } from 'react-router';
import { useState, useEffect } from 'react';

const SongDetailPage = () => {
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [song, setSong] = useState(null)

    useEffect(() => {
        const fetchSong = async () => {
            try {
                const response = await songAPI.getById(id)
                setSong(response.data)
                setLoading(false)
            } catch (err) {
                setError(err.message)
                setLoading(false)
            }
        }
        fetchSong()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                <div className="pb-44">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
                        <h1 className="text-2xl font-bold text-gray-800">Loading...</h1>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                <div className="pb-44">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Error!</h1>
                        <p className="text-gray-600">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col items-center justify-center col-span-full text-center py-16">
                <div className="text-6xl mb-4">🎵</div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">Song View Test</h2>
                <p className="text-gray-500">Song Title: {song.title}</p>
            </div>
        </div>
    )
}

export default SongDetailPage