import { useState } from 'react'
import { songAPI } from '../services/api'

function AddSongForm({ onSongAdded }) {
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
    })
    const [audioFile, setAudioFile] = useState(null)
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
        <form onSubmit={handleSubmit} className="add-song-form">
            <h2>Add New Song</h2>
            {!success && error && <div className='error-message'>{error}</div>}
            {success && <div className='success-message'>Song Added!</div>}
            <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Song Title"
                disabled={submitting}
            />
            <input
                type="text"
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                placeholder="Artist Name"
                disabled={submitting}
            />
            <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                disabled={submitting}
            />
            <button
                type="submit"
                disabled={submitting}
            >
                {submitting ? 'Adding...' : 'Add Song'}
            </button>
        </form>
    )
}

export default AddSongForm