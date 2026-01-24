import axios from 'axios'

const API_BASE_URL = '/api'

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
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
    }
}

export default apiClient