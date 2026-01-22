import { useState } from 'react'
import { songAPI } from '../services/api'

function AddSongForm({ onSongAdded }) {
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        duration: '',
    })

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.title || !formData.artist || !formData.duration) {
            setError('Please fill in all fields!')
            return
        }

        if (formData.duration <= 0) {
            setError('Duration must be 0 or greater!')
            return
        }

        setSubmitting(true);
        try {
            const response = await songAPI.create(formData)
            onSongAdded()
            
            setFormData({
                title: '',
                artist: '',
                duration: '',
            })
        } catch(error) {
            console.error('Error creating song:', error)
            setError('Error creating song...')
        } finally {
            setSubmitting(false)
            setSuccess(true)
            setError(null)
            setTimeout(() => setSuccess(false), 3000)
        }
    }

    const handleChange = (e) => {
        const value = e.target.name === 'duration' ? parseInt(e.target.value) || '' : e.target.value

        setFormData({
            ...formData,
            [e.target.name]: value
        })
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
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="Song Duration in Seconds"
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