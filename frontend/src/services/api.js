import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

/**
 * Base axios instance for all song-related API calls.
 * 
 * withCredentials: true is required for the browser to send/receive the httpOnly auth cookies
 * on cross-origin requests (frontend & backend live on different domains in production). Without
 * it the every authenticated requests would fail as 401.
 */
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

/**
 * API layer for song-related backend calls.
 */
export const songAPI = {
    /**
     * Gets all the songs created by the user and those that are public. Used for the song library.
     */
    getAll: async () => {
        return await apiClient.get('/songs/')
    },

    /**
     * Gets a specific song selected by the user. Used for when the user chooses a song from the
     * song library and goes to the song detail page.
     */
    getById: async (id) => {
        return await apiClient.get(`/songs/${id}/`)
    },

    /**
     * Creates a song. Accepts either plain object JSON or a FormData instance (for audio file
     * uploads), switches the Content-Type header accordingly.
     */
    create: async (songData) => {
        const headers = songData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }
        return await apiClient.post('/songs/', songData, { headers })
    },

    /**
     * Analyzes a song via their id. This is automatically called once the user submits a song
     * via the add song form.
     */
    analyze: async (songId) => {
        return await apiClient.post(`/songs/${songId}/analyze/`)
    },
}