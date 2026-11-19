import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'

import RegisterPage from '../../pages/RegisterPage'

const { mockRegister, mockGoogleLogin } = vi.hoisted(() => ({
    mockRegister: vi.fn(),
    mockGoogleLogin: vi.fn(),
}))

/**
 * Isolates registration from the real authentication context.
 */
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        register: mockRegister,
        googleLogin: mockGoogleLogin,
    }),
}))

/**
 * Simulates successful and unsuccessful Google authentication.
 */
vi.mock('@react-oauth/google', () => ({
    GoogleLogin: ({ onSuccess, onError }) => (
        <div>
            <button
                type="button"
                onClick={() => onSuccess({
                    credential: 'fake-google-credential',
                })}
            >
                Mock Google success
            </button>

            <button type="button" onClick={onError}>
                Mock Google error
            </button>
        </div>
    ),
}))

/**
 * Renders the registration page with routes for testing navigation.
 */
function renderRegisterPage() {
    return render(
        <MemoryRouter initialEntries={['/register']}>
            <Routes>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/songs" element={<div>Song Library</div>} />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
        </MemoryRouter>
    )
}

/**
 * Populates and submits the registration form.
 */
async function submitRegistration(user) {
    await user.type(screen.getByPlaceholderText('Username'), 'testuser')
    await user.type(screen.getByPlaceholderText('Email'), 'test@email.com')
    await user.type(screen.getByPlaceholderText('Password'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))
}

describe('RegisterPage', () => {
    beforeEach(() => {
        mockRegister.mockReset()
        mockGoogleLogin.mockReset()
    })

    it('renders the registration form and login link', () => {
        /**
         * Verifies that all required registration controls are displayed.
         */

        // Arrange & Act
        renderRegisterPage()

        // Assert
        expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')
        expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
        expect(screen.getByRole('button', { name: 'Sign Up' })).toBeEnabled()
        expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
    })

    it('registers a user and navigates to the song library', async () => {
        /**
         * Verifies that registration submits the correct credentials
         * and redirects after a successful response.
         */

        // Arrange
        const user = userEvent.setup()
        mockRegister.mockResolvedValue(undefined)
        renderRegisterPage()

        // Act
        await submitRegistration(user)

        // Assert
        expect(mockRegister).toHaveBeenCalledExactlyOnceWith(
            'testuser', 'Password123!', 'test@email.com'
        )
        expect(await screen.findByText('Song Library')).toBeInTheDocument()
    })

    it('displays a registration error returned by the backend', async () => {
        /**
         * Verifies that backend validation errors are displayed.
         */

        // Arrange
        const user = userEvent.setup()
        mockRegister.mockRejectedValue({
            response: {
                data: { error: 'Username already taken' },
            },
        })
        renderRegisterPage()

        // Act
        await submitRegistration(user)

        // Assert
        expect(await screen.findByText('Username already taken')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Sign Up' })).toBeEnabled()
    })

    it('displays multiple password validation errors', async () => {
        /**
         * Verifies that every validation message in a backend error
         * array is displayed individually.
         */

        // Arrange
        const user = userEvent.setup()
        mockRegister.mockRejectedValue({
            response: {
                data: {
                    error: [
                        'This password is too short.',
                        'This password is too common.',
                    ],
                },
            },
        })
        renderRegisterPage()

        // Act
        await submitRegistration(user)

        // Assert
        expect(await screen.findByText('This password is too short.')).toBeInTheDocument()
        expect(screen.getByText('This password is too common.')).toBeInTheDocument()
    })

    it('displays a generic error when registration fails unexpectedly', async () => {
        /**
         * Verifies that errors without a backend message use fallback text.
         */

        // Arrange
        const user = userEvent.setup()
        mockRegister.mockRejectedValue(new Error('Network error'))
        renderRegisterPage()

        // Act
        await submitRegistration(user)

        // Assert
        expect(
            await screen.findByText('Something went wrong. Please try again.')
        ).toBeInTheDocument()
    })

    it('disables registration controls while submitting', async () => {
        /**
         * Verifies that users cannot submit another registration while
         * the current request is pending.
         */

        // Arrange
        const user = userEvent.setup()
        let finishRegistration

        mockRegister.mockImplementation(() => new Promise(resolve => {
            finishRegistration = resolve
        }))

        renderRegisterPage()

        // Act
        await submitRegistration(user)

        // Assert
        expect(screen.getByPlaceholderText('Username')).toBeDisabled()
        expect(screen.getByPlaceholderText('Email')).toBeDisabled()
        expect(screen.getByPlaceholderText('Password')).toBeDisabled()

        expect(
            await screen.findByRole('button', { name: 'Creating account...' })
        ).toBeDisabled()

        finishRegistration()

        expect(await screen.findByText('Song Library')).toBeInTheDocument()
    })

    it('registers through Google and navigates to the song library', async () => {
        /**
         * Verifies that a Google credential is forwarded to authentication.
         */

        // Arrange
        const user = userEvent.setup()
        mockGoogleLogin.mockResolvedValue(undefined)
        renderRegisterPage()

        // Act
        await user.click(screen.getByRole('button', {
            name: /mock google success/i,
        }))

        // Assert
        expect(mockGoogleLogin).toHaveBeenCalledExactlyOnceWith(
            'fake-google-credential'
        )
        expect(await screen.findByText('Song Library')).toBeInTheDocument()
    })

    it('displays an error when Google authentication fails', async () => {
        /**
         * Verifies that failed Google authentication displays an error.
         */

        // Arrange
        const user = userEvent.setup()
        mockGoogleLogin.mockRejectedValue(new Error('Google login failed'))
        renderRegisterPage()

        // Act
        await user.click(screen.getByRole('button', {
            name: /mock google success/i,
        }))

        // Assert
        expect(await screen.findByText('Google login failed')).toBeInTheDocument()
    })

    it('displays an error when the Google widget fails', async () => {
        /**
         * Verifies that a Google widget error is handled without making
         * an authentication request.
         */

        // Arrange
        const user = userEvent.setup()
        renderRegisterPage()

        // Act
        await user.click(screen.getByRole('button', {
            name: /mock google error/i,
        }))

        // Assert
        expect(screen.getByText('Google login failed')).toBeInTheDocument()
        expect(mockGoogleLogin).not.toHaveBeenCalled()
    })

    it('navigates to the login page', async () => {
        /**
         * Verifies that existing users can navigate to the login page.
         */

        // Arrange
        const user = userEvent.setup()
        renderRegisterPage()

        // Act
        await user.click(screen.getByRole('link', { name: 'Log in' }))

        // Assert
        expect(await screen.findByText('Login Page')).toBeInTheDocument()
    })
})