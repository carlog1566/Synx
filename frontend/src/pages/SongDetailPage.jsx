import { songAPI } from "../services/api";
import { Link, useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import SongDetailNav from "../components/SongDetailNav";
import Error from "../components/Error";
import Loading from "../components/Loading";

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
            <div>
                <SongDetailNav />
                <Loading />
            </div>
        )
    }

    if (error) {
        return (
            <div>
                <SongDetailNav />
                <Error error={error} />
            </div>
        )
    }

    return (
        <div>
            <SongDetailNav />
            <div className="flex flex-col items-center justify-center col-span-full text-center py-16">
                <div className="text-6xl mb-4">🎵</div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">Song View Test</h2>
                <p className="text-gray-500">Song Title: {song.title}</p>
            </div>
        </div>
    )
}

export default SongDetailPage