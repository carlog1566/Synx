import { useState } from 'react'
import { songAPI } from '../services/api'

function AddSongForm({ onSongAdded }) {
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
    })
    const [audioFile, setAudioFile] = useState(null)
    const [fileInputKey, setFileInputKey] = useState(Date.now())
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    
    const handleChange = (e) => {
        const value = e.target.name === 'duration' ? parseInt(e.target.value) || '' : e.target.value

        setFormData({
            ...formData,
            [e.target.name]: value
        })
    }


    const handleFileChange = (e) => {
        setAudioFile(e.target.files[0])
    }


    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.title || !formData.artist) {
            setError('Please fill in all fields!')
            return
        }

        if (!audioFile) {
            setError('Please select an audio file!')
            return
        }

        if (formData.duration <= 0) {
            setError('Duration must be 0 or greater!')
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            const formDataToSend = new FormData()
            formDataToSend.append('title', formData.title)
            formDataToSend.append('artist', formData.artist)
            formDataToSend.append('audio_file', audioFile)

            const response = await songAPI.create(formDataToSend)
            onSongAdded(response.data)
            
            setFormData({
                title: '',
                artist: '',
            })
            setAudioFile(null)
            setFileInputKey(Date.now())

            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)

        } catch(error) {
            console.error('Error creating song:', error)
            setError('Error creating song...')
        } finally {
            setSubmitting(false)
        }
    }

    
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-gradient-to-r from-primary to-secondary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-lg">
                    +
                </span>
                Add New Song
            </h2>

            {/* Alert Messages */}
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                    <span className="text-xl mr-2">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start animate-pulse">
                    <span className="text-xl mr-2">✓</span>
                    <span>Song added successfully!</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Song Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter song title"
                        disabled={submitting}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Artist Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Artist Name
                    </label>
                    <input
                        type="text"
                        name="artist"
                        value={formData.artist}
                        onChange={handleChange}
                        placeholder="Enter artist name"
                        disabled={submitting}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div>

                {/* File Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Audio File
                    </label>
                    <div className="relative">
                        <input
                            key={fileInputKey}
                            type="file"
                            accept="audio/*"
                            onChange={handleFileChange}
                            disabled={submitting}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>
                    {audioFile && (
                        <p className="mt-2 text-sm text-gray-600 flex items-center">
                            <span className="mr-2">📎</span>
                            {audioFile.name}
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                    {submitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                        </>
                    ) : (
                        <>
                            <span className="mr-2">+</span>
                            Add Song
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}

export default AddSongForm