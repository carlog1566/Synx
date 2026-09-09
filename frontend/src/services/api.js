import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

export const songAPI = {
    getAll: async () => {
        return await apiClient.get('/songs/')
    },

    getById: async (id) => {
        return await apiClient.get(`/songs/${id}/`)
    },

    create: async (songData) => {
        const headers = songData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }
        return await apiClient.post('/songs/', songData, { headers })
    },

    analyze: async (songId) => {
        return await apiClient.post(`/songs/${songId}/analyze/`)
    },
}