import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import LoginPage from '../../pages/LoginPage'

// Shared auth mocks for isolating LoginPage from the API and auth context
const { mockLogin, mockGoogleLogin } = vi.hoisted(() => ({
    mockLogin: vi.fn(),
    mockGoogleLogin: vi.fn(),
}))

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
        googleLogin: mockGoogleLogin,
    })
}))

// Replace Google SDK widget so tests don't contact Google
vi.mock('@react-oauth/google', () => ({
    GoogleLogin: ({ onSuccess, onError }) => (
        <div>
            <button
                type="button"
                onClick={() => onSuccess({ credential: 'fake-google-credential' })}
            >
                Mock Google success
            </button>
            <button 
                type="button" 
                onClick={onError}
            >
                Mock Google error
            </button>
        </div>
    )
}))


/**
 * Renders the login page with test-only routes, so that we don't have to mount the
 * full application or connect to the backend
 */
function renderLoginPage() {
    return render(
        <MemoryRouter initialEntries={['/login/']}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/songs" element={<div>Song Library</div>} />
                <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
                <Route path="/register" element={<div>Register Page</div>} />
            </Routes>
        </MemoryRouter>
    )
}


describe('LoginPage', () => {
    // Reset mocks before each test
    beforeEach(() => {
        mockLogin.mockReset()
        mockGoogleLogin.mockReset()
    })

    it('renders the login form and account links', () => {
        /**
         * Verifies that username/password fields, the login button, and account
         * navigation links render correctly.
         */

        // Arrange & Act
        renderLoginPage()

        // Assert
        expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
        expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Forgot Password?' })).toHaveAttribute('href', '/forgot-password')
        expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register')
    })

    it('submits the entered credentials and navigates to songs after successful login', async () => {
        /**
         * Verifies that login receives entered credentials and redirects to the 
         * song library when it succeeds.
         */

        // Arrange
        const user = userEvent.setup()
        mockLogin.mockResolvedValue(undefined)
        renderLoginPage()

        // Act
        await user.type(screen.getByPlaceholderText('Username'), 'testuser')
        await user.type(screen.getByPlaceholderText('Password'), 'testpassword')
        await user.click(screen.getByRole('button', { name: 'Log In' }))

        // Assert
        expect(mockLogin).toHaveBeenCalledExactlyOnceWith('testuser', 'testpassword')
        expect(await screen.findByText('Song Library')).toBeInTheDocument()
    })

    it('shows an error and remains on the login page when credentials are rejected', async () => {
        /**
         * Verifies that a rejected login displays an error
         * and allows the user to retry.
         */

        // Arrange
        const user = userEvent.setup()
        mockLogin.mockRejectedValue(new Error('Unauthorized'))
        renderLoginPage()

        // Act
        await user.type(screen.getByPlaceholderText('Username'), 'wronguser')
        await user.type(screen.getByPlaceholderText('Password'), 'wrongpassword')
        await user.click(screen.getByRole('button', { name: 'Log In' }))

        // Assert
        expect(await screen.findByText('Invalid username or password')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Log In' })).toBeEnabled()
    })

    it('disables form inputs and shows loading while login is pending', async () => {
        /**
         * Verifies that submission disables inputs and shows progress
         * until authentication finishes.
         */

        // Arrange
        const user = userEvent.setup()
        let finishLogin
        mockLogin.mockImplementation(() => new Promise((resolve) => { finishLogin = resolve }))
        renderLoginPage()

        // Act
        await user.type(screen.getByPlaceholderText('Username'), 'testuser')
        await user.type(screen.getByPlaceholderText('Password'), 'testpassword')
        await user.click(screen.getByRole('button', { name: 'Log In' }))

        // Assert
        expect(screen.getByPlaceholderText('Username')).toBeDisabled()
        expect(screen.getByPlaceholderText('Password')).toBeDisabled()
        expect(await screen.getByRole('button', { name: 'Loading...' })).toBeDisabled()

        finishLogin()
        expect(await screen.findByText('Song Library')).toBeInTheDocument()
    })

    it('logs in with a Google credential and navigates to songs', async () => {
        /**
         * Verifies that a successful Google credential is passed to auth
         * and redirects to the song library.
         */

        // Arrange
        const user = userEvent.setup()
        mockGoogleLogin.mockResolvedValue(undefined)
        renderLoginPage()

        // Act
        await user.click(screen.getByRole('button', { name: 'Mock Google success' }))

        // Assert
        expect(mockGoogleLogin).toHaveBeenCalledExactlyOnceWith('fake-google-credential')
        expect(await screen.findByText('Song Library')).toBeInTheDocument()
    })

    it('shows an error when Google authentication fails', async () => {
        /**
         * Verifies that a rejected Google authentication request
         * displays the appropriate error.
         */

        // Arrange
        const user = userEvent.setup()
        mockGoogleLogin.mockRejectedValue(new Error('Google auth failed'))
        renderLoginPage()

        // Act
        await user.click(screen.getByRole('button', { name: 'Mock Google success' }))

        // Assert
        expect(await screen.findByText('Google login failed')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument()
    })

    it('shows an error when the Google widget reports an error', async () => {
        /**
         * Verifies that Google widget errors display feedback
         * without calling authentication.
         */

        // Arrange
        const user = userEvent.setup()
        renderLoginPage()

        // Act
        await user.click(screen.getByRole('button', { name: 'Mock Google error' }))

        // Assert
        expect(screen.getByText('Google login failed')).toBeInTheDocument()
        expect(mockGoogleLogin).not.toHaveBeenCalled()
    })

    it('navigates to the password recovery page', async () => {
        /**
         * Verifies that the forgot-password link takes users
         * to the password recovery route.
         */

        // Arrange
        const user = userEvent.setup()
        renderLoginPage()

        // Act
        await user.click(screen.getByRole('link', { name: 'Forgot Password?' }))

        // Assert
        expect(await screen.findByText('Forgot Password Page')).toBeInTheDocument()
    })

    it('navigates to the registration page', async () => {
        /**
         * Verifies that the sign-up link takes users
         * to the registration route.
         */

        // Arrange
        const user = userEvent.setup()
        renderLoginPage()

        // Act
        await user.click(screen.getByRole('link', { name: 'Sign up' }))

        // Assert
        expect(await screen.findByText('Register Page')).toBeInTheDocument()
    })
})
