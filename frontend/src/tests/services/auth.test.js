import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authAPI } from '../../services/auth'
import { apiClient } from '../../services/api'

/**
 * Replaces Axios requests to avoid contacting the Django backend.
 */
vi.mock('../../services/api', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
}))

describe('authAPI', () => {
    beforeEach(() => {
        vi.resetAllMocks()

        apiClient.get.mockResolvedValue({ data: {} })
        apiClient.post.mockResolvedValue({ data: {} })
    })

    it('sends registration credentials to the registration endpoint', async () => {
        /** Verifies the registration request method, URL, and payload. */

        // Arrange
        const username = 'testuser'
        const password = 'Password123!'
        const email = 'test@email.com'

        // Act
        await authAPI.register(username, password, email)

        // Assert
        expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
            '/auth/register/',
            { username, password, email }
        )
    })

    it('sends credentials to the login endpoint', async () => {
        /** Verifies that login forwards the username and password. */

        // Arrange
        const username = 'testuser'
        const password = 'Password123!'

        // Act
        await authAPI.login(username, password)

        // Assert
        expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
            '/auth/login/',
            { username, password }
        )
    })

    it('sends the Google credential to the Google authentication endpoint', async () => {
        /** Verifies that the Google credential is correctly forwarded. */

        // Arrange
        const credential = 'fake-google-token'

        // Act
        await authAPI.googleLogin(credential)

        // Assert
        expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
            '/auth/google/',
            { credential }
        )
    })

    it('retrieves the current authenticated user', async () => {
        /** Verifies that the current user endpoint is called. */

        // Arrange
        const response = { data: { username: 'testuser' } }
        apiClient.get.mockResolvedValue(response)

        // Act
        const result = await authAPI.me()

        // Assert
        expect(apiClient.get).toHaveBeenCalledExactlyOnceWith('/auth/me/')
        expect(result).toEqual(response)
    })

    it('sends a logout request', async () => {
        /** Verifies that logout sends a POST request to the correct endpoint. */

        // Arrange & Act
        await authAPI.logout()

        // Assert
        expect(apiClient.post).toHaveBeenCalledExactlyOnceWith('/auth/logout/')
    })

    it('requests a password reset email', async () => {
        /** Verifies that password recovery forwards the supplied email. */

        // Arrange
        const email = 'test@email.com'

        // Act
        await authAPI.forgotPassword(email)

        // Assert
        expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
            '/auth/forgot-password/',
            { email }
        )
    })

    it('sends password reset credentials to the backend', async () => {
        /** Verifies that password reset payload keys match the backend API. */

        // Arrange
        const uid = 'test-uid'
        const token = 'test-token'
        const newPassword = 'NewPassword123!'

        // Act
        await authAPI.resetPassword(uid, token, newPassword)

        // Assert
        expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
            '/auth/reset-password/',
            {
                uid,
                token,
                new_password: newPassword,
            }
        )
    })

    it('sends the current and new passwords when changing passwords', async () => {
        /** Verifies that password change payload keys match the Django API. */

        // Arrange
        const currentPassword = 'OldPassword123!'
        const newPassword = 'NewPassword123!'
        const confirmPassword = 'NewPassword123!'

        // Act
        await authAPI.changePassword(
            currentPassword, newPassword, confirmPassword
        )

        // Assert
        expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
            '/auth/change-password/',
            {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            }
        )
    })

    it('sends account deletion confirmation', async () => {
        /** Verifies that account deletion forwards the confirmation payload. */

        // Arrange
        const password = 'Password123!'
        const confirmation = ''

        // Act
        await authAPI.deleteAccount(password, confirmation)

        // Assert
        expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
            '/auth/delete-account/',
            { password, confirmation }
        )
    })

    it('retrieves the authenticated users statistics', async () => {
        /** Verifies that account statistics use the correct endpoint. */

        // Arrange & Act
        await authAPI.getStats()

        // Assert
        expect(apiClient.get).toHaveBeenCalledExactlyOnceWith('/auth/stats/')
    })

    it('propagates backend request errors', async () => {
        /** Verifies that request errors are available to calling components. */

        // Arrange
        apiClient.post.mockRejectedValue(new Error('Unauthorized'))

        // Act & Assert
        await expect(
            authAPI.login('testuser', 'incorrect')
        ).rejects.toThrow('Unauthorized')
    })
})