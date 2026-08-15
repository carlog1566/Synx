import apiClient from './api'

export const authAPI = {
    register: async (username, password, email) => {
        return await apiClient.post('/auth/register/', { username, password, email })
    },

    login: async (username, password) => {
        return await apiClient.post('/auth/login/', { username, password })
    },

    logout: async () => {
        return await apiClient.post('/auth/logout/')
    }
}