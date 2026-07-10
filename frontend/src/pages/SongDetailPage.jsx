import { songAPI } from "../services/api";
import { Link, useParams } from 'react-router';
import { useState, useEffect } from 'react';
import SongDetailNav from "../components/SongDetailNav";
import Error from "../components/Error";
import Loading from "../components/Loading";
import TabDisplay from "../components/TabDisplay";
import FretboardDisplay from "../components/FretboardDisplay";
import AudioPlayer from "../components/AudioPlayer";


const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    const paddedSecs = secs.toString().padStart(2, '0');
    
    return `${mins}:${paddedSecs}`;
}

const SongDetailPage = () => {
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [song, setSong] = useState(null)
    const [selectedInstrument, setSelectedInstrument] = useState('guitar')

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

    if (!song) {
        return (
            <div>
                <SongDetailNav />
                <h2>Song Not Found</h2>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <SongDetailNav />
            <div className="container mx-auto px-4 py-8 max-w-6xl">

                {/* Song Header */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">
                                {song.title}
                            </h1>
                            <p className="text-xl text-gray-600 mb-2">
                                By: {song.artist}
                            </p>
                            <div className="flex items-center text-gray-500 mb-4">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatDuration(song.duration)}
                            </div>
                        </div>
                    </div>

                    <div>
                        {song.analyzed ? (
                            <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Analyzed
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                                ⚠️ Not Analyzed
                            </span>
                        )}
                    </div>
                </div>

                {/* Unanalyzed Warning */}
                {!song.analyzed && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8 text-center">
                        <div className="text-4xl mb-3">
                            ⏳
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            This song hasn't been analyzed yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Analyze the song to generate chords and tabs
                        </p>
                        <Link to="/songs">
                            <button className="bg-primary hover:bg-primary/80 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 cursor-pointer">
                                Go Back and Analyze
                            </button>
                        </Link>
                    </div>
                )}

                {/* Audio Player */}
                {song.audio_file && (
                    <AudioPlayer audioUrl={song.audio_file} />
                )}

                {/* Controls Section */}
                {song.analyzed && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <label className="text-gray-700 font-medium">
                                    Instrument:
                                </label>
                                <select
                                    value={selectedInstrument}
                                    onChange={(e) => setSelectedInstrument(e.target.value)}
                                    className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-300 focus:border-purple-600 focus:outline-none"
                                >
                                    <option value="guitar">Guitar</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs Display */}
                {song.analyzed && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        {/* <TabDisplay tabs={song.tabs} instrument={selectedInstrument} /> */}
                        <FretboardDisplay tabData={song.tabs.guitar} currentTime={6} formatDuration={formatDuration}/>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SongDetailPage