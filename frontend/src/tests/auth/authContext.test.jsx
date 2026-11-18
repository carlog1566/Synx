import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { AuthProvider, useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/auth'

/**
 * Isolates the authentication provider from backend requests.
 */
vi.mock('../../services/auth', () => ({
    authAPI: {
        me: vi.fn(),
        login: vi.fn(),
        register: vi.fn(),
        googleLogin: vi.fn(),
        logout: vi.fn(),
    },
}))

const testUser = {
    username: 'testuser',
    email: 'test@email.com',
    has_password: true,
}

/**
 * Renders the actual authentication hook inside its provider.
 */
function renderAuth() {
    return renderHook(() => useAuth(), {
        wrapper: AuthProvider,
    })
}

/**
 * Initializes the provider without an authenticated session.
 */
async function renderUnauthenticated() {
    authAPI.me.mockRejectedValueOnce(new Error('Unauthorized'))

    const hook = renderAuth()

    await waitFor(() => {
        expect(hook.result.current.loading).toBe(false)
    })

    return hook
}

describe('AuthContext', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('restores an existing authenticated session', async () => {
        /** Verifies that an existing session populates the user state. */

        // Arrange
        authAPI.me.mockResolvedValue({ data: testUser })

        // Act
        const { result } = renderAuth()

        // Assert
        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })

        expect(result.current.user).toEqual(testUser)
        expect(authAPI.me).toHaveBeenCalledTimes(1)
    })

    it('leaves the user unauthenticated when session restoration fails', async () => {
        /** Verifies that invalid sessions do not authenticate the user. */

        // Arrange & Act
        const { result } = await renderUnauthenticated()

        // Assert
        expect(result.current.user).toBeNull()
        expect(result.current.loading).toBe(false)
    })

    it('starts in a loading state before checking authentication', async () => {
        /** Verifies that authentication starts in a loading state. */

        // Arrange
        let finishRequest
        authAPI.me.mockImplementation(() => new Promise(resolve => {
            finishRequest = resolve
        }))

        // Act
        const { result } = renderAuth()

        // Assert
        expect(result.current.loading).toBe(true)
        expect(result.current.user).toBeNull()

        await act(async () => {
            finishRequest({ data: testUser })
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.user).toEqual(testUser)
    })

    it('updates the user after successful login', async () => {
        /** Verifies that logging in retrieves the authenticated user. */

        // Arrange
        const { result } = await renderUnauthenticated()
        authAPI.login.mockResolvedValue({})
        authAPI.me.mockResolvedValue({ data: testUser })

        // Act
        await act(async () => {
            await result.current.login('testuser', 'Password123!')
        })

        // Assert
        expect(authAPI.login).toHaveBeenCalledExactlyOnceWith(
            'testuser', 'Password123!'
        )
        expect(result.current.user).toEqual(testUser)
        expect(authAPI.me).toHaveBeenCalledTimes(2)
    })

    it('clears the user and propagates login errors', async () => {
        /** Verifies that failed authentication clears the user state. */

        // Arrange
        const { result } = await renderUnauthenticated()
        authAPI.login.mockRejectedValue(new Error('Invalid credentials'))

        // Act & Assert
        await act(async () => {
            await expect(
                result.current.login('testuser', 'incorrect')
            ).rejects.toThrow('Invalid credentials')
        })

        expect(result.current.user).toBeNull()
        expect(result.current.loading).toBe(false)
        expect(authAPI.me).toHaveBeenCalledTimes(1)
    })

    it('updates the user after successful registration', async () => {
        /** Verifies that new users are authenticated after registration. */

        // Arrange
        const { result } = await renderUnauthenticated()
        authAPI.register.mockResolvedValue({})
        authAPI.me.mockResolvedValue({ data: testUser })

        // Act
        await act(async () => {
            await result.current.register(
                'testuser', 'Password123!', 'test@email.com'
            )
        })

        // Assert
        expect(authAPI.register).toHaveBeenCalledExactlyOnceWith(
            'testuser', 'Password123!', 'test@email.com'
        )
        expect(result.current.user).toEqual(testUser)
    })

    it('propagates registration errors', async () => {
        /** Verifies that registration errors reach the calling component. */

        // Arrange
        const { result } = await renderUnauthenticated()
        authAPI.register.mockRejectedValue(new Error('Username taken'))

        // Act & Assert
        await act(async () => {
            await expect(result.current.register(
                'testuser', 'Password123!', 'test@email.com'
            )).rejects.toThrow('Username taken')
        })

        expect(result.current.user).toBeNull()
    })

    it('updates the user after successful Google authentication', async () => {
        /** Verifies that Google authentication populates the user state. */

        // Arrange
        const { result } = await renderUnauthenticated()
        authAPI.googleLogin.mockResolvedValue({})
        authAPI.me.mockResolvedValue({ data: testUser })

        // Act
        await act(async () => {
            await result.current.googleLogin('fake-token')
        })

        // Assert
        expect(authAPI.googleLogin).toHaveBeenCalledExactlyOnceWith('fake-token')
        expect(result.current.user).toEqual(testUser)
    })

    it('propagates Google authentication errors', async () => {
        /** Verifies that unsuccessful Google authentication clears the user. */

        // Arrange
        const { result } = await renderUnauthenticated()
        authAPI.googleLogin.mockRejectedValue(new Error('Invalid token'))

        // Act & Assert
        await act(async () => {
            await expect(
                result.current.googleLogin('invalid-token')
            ).rejects.toThrow('Invalid token')
        })

        expect(result.current.user).toBeNull()
    })

    it('clears the authenticated user after logout', async () => {
        /** Verifies that logout removes the authenticated user. */

        // Arrange
        authAPI.me.mockResolvedValue({ data: testUser })
        authAPI.logout.mockResolvedValue({})

        const { result } = renderAuth()

        await waitFor(() => {
            expect(result.current.user).toEqual(testUser)
        })

        // Act
        await act(async () => {
            await result.current.logout()
        })

        // Assert
        expect(authAPI.logout).toHaveBeenCalledTimes(1)
        expect(result.current.user).toBeNull()
    })

    it('clears local authentication even when logout fails', async () => {
        /** Verifies the provider's fallback behavior for failed logout. */

        // Arrange
        authAPI.me.mockResolvedValue({ data: testUser })
        authAPI.logout.mockRejectedValue(new Error('Network error'))

        const { result } = renderAuth()

        await waitFor(() => {
            expect(result.current.user).toEqual(testUser)
        })

        // Act
        await act(async () => {
            await result.current.logout()
        })

        // Assert
        expect(result.current.user).toBeNull()
        expect(result.current.loading).toBe(false)
    })

    it('clears the user without making a logout request', async () => {
        /** Verifies that clearUser removes local state after account deletion. */

        // Arrange
        authAPI.me.mockResolvedValue({ data: testUser })

        const { result } = renderAuth()

        await waitFor(() => {
            expect(result.current.user).toEqual(testUser)
        })

        // Act
        act(() => {
            result.current.clearUser()
        })

        // Assert
        expect(result.current.user).toBeNull()
        expect(authAPI.logout).not.toHaveBeenCalled()
    })
})