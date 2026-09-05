import { apiClient } from './api'

export const authAPI = {
    register: async (username, password, email) => {
        return await apiClient.post('/auth/register/', { username, password, email })
    },

    login: async (username, password) => {
        return await apiClient.post('/auth/login/', { username, password })
    },

    googleLogin: async (credential) => {
        return await apiClient.post('/auth/google/', { credential })
    },
    
    me: async () => {
        return await apiClient.get('/auth/me/')
    },

    logout: async () => {
        return await apiClient.post('/auth/logout/')
    },

    forgotPassword: async (email) => {
        return await apiClient.post('/auth/forgot-password/', { email })
    },

    resetPassword: async (uid, token, newPassword) => {
        return await apiClient.post('/auth/reset-password/', { uid, token, new_password: newPassword})
    },
}   