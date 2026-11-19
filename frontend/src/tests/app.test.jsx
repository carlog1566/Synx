import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import App from '../App'
import { authAPI } from '../services/auth'

/**
 * Isolates application authentication from backend requests.
 * The real AuthProvider and ProtectedRoute remain in use.
 */
vi.mock('../services/auth', () => ({
    authAPI: {
        me: vi.fn(),
    },
}))

/**
 * Isolates application routing from individual page functionality.
 * Each page is tested separately in its dedicated test file.
 */
vi.mock('../pages/HomePage', () => ({
    default: () => <div>Mock Home Page</div>,
}))

vi.mock('../pages/LoginPage', () => ({
    default: () => <div>Mock Login Page</div>,
}))

vi.mock('../pages/RegisterPage', () => ({
    default: () => <div>Mock Register Page</div>,
}))

vi.mock('../pages/ForgotPasswordPage', () => ({
    default: () => <div>Mock Forgot Password Page</div>,
}))

vi.mock('../pages/ResetPasswordPage', () => ({
    default: () => <div>Mock Reset Password Page</div>,
}))

vi.mock('../pages/SongListPage', () => ({
    default: () => <div>Mock Song List Page</div>,
}))

vi.mock('../pages/SongDetailPage', () => ({
    default: () => <div>Mock Song Detail Page</div>,
}))

vi.mock('../pages/DashboardPage', () => ({
    default: () => <div>Mock Dashboard Page</div>,
}))

/**
 * Preserves the navbar's ref and menu state interface while
 * isolating its individual navigation behavior.
 */
vi.mock('../components/Navbar', () => ({
    default: ({ menuOpen, setMenuOpen, navRef }) => (
        <header ref={navRef}>
            <p>Mock Navbar</p>

            <button onClick={() => setMenuOpen(!menuOpen)}>
                Toggle Menu
            </button>

            {menuOpen && <p>Mock Mobile Menu</p>}
        </header>
    ),
}))

const testUser = {
    username: 'testuser',
    email: 'test@email.com',
}

let resizeCallback

const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

/**
 * Renders the application at a specified route.
 */
function renderApp(path = '/') {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>
    )
}

describe('App', () => {
    beforeEach(() => {
        vi.resetAllMocks()

        authAPI.me.mockResolvedValue({
            data: testUser,
        })

        resizeCallback = null

        vi.spyOn(globalThis, 'ResizeObserver')
            .mockImplementation(function (callback) {
                resizeCallback = callback
                this.observe = mockObserve
                this.disconnect = mockDisconnect
            })
    })

    it('renders the home page at the root route', async () => {
        /**
         * Verifies that the application's root route
         * renders the home page.
         */

        // Arrange & Act
        renderApp('/')

        // Assert
        expect(await screen.findByText(
            'Mock Home Page'
        )).toBeInTheDocument()

        expect(screen.getByText('Mock Navbar')).toBeInTheDocument()
    })

    it('renders the login page', async () => {
        /**
         * Verifies that the login route renders
         * the appropriate page.
         */

        // Arrange & Act
        renderApp('/login')

        // Assert
        expect(await screen.findByText(
            'Mock Login Page'
        )).toBeInTheDocument()
    })

    it('renders the registration page', async () => {
        /**
         * Verifies that the registration route renders
         * the appropriate page.
         */

        // Arrange & Act
        renderApp('/register')

        // Assert
        expect(await screen.findByText(
            'Mock Register Page'
        )).toBeInTheDocument()
    })

    it('renders the forgot password page', async () => {
        /**
         * Verifies that the password recovery route
         * is registered correctly.
         */

        // Arrange & Act
        renderApp('/forgot-password')

        // Assert
        expect(await screen.findByText(
            'Mock Forgot Password Page'
        )).toBeInTheDocument()
    })

    it('renders the password reset page', async () => {
        /**
         * Verifies that password reset routes accept
         * a UID and token.
         */

        // Arrange & Act
        renderApp('/reset-password/test-uid/test-token/')

        // Assert
        expect(await screen.findByText(
            'Mock Reset Password Page'
        )).toBeInTheDocument()
    })

    it('renders the account dashboard', async () => {
        /**
         * Verifies that the dashboard route renders
         * the appropriate page.
         */

        // Arrange & Act
        renderApp('/dashboard')

        // Assert
        expect(await screen.findByText(
            'Mock Dashboard Page'
        )).toBeInTheDocument()
    })

    it('allows authenticated users to access the song library', async () => {
        /**
         * Verifies that the application integrates AuthProvider
         * with the protected song library route.
         */

        // Arrange & Act
        renderApp('/songs')

        // Assert
        expect(await screen.findByText(
            'Mock Song List Page'
        )).toBeInTheDocument()
    })

    it('allows authenticated users to access song details', async () => {
        /**
         * Verifies that authenticated users can access
         * individual song detail routes.
         */

        // Arrange & Act
        renderApp('/songs/1')

        // Assert
        expect(await screen.findByText(
            'Mock Song Detail Page'
        )).toBeInTheDocument()
    })

    it('redirects unauthenticated users away from the song library', async () => {
        /**
         * Verifies that the song library cannot be accessed
         * without an authenticated session.
         */

        // Arrange
        authAPI.me.mockRejectedValue(
            new Error('Unauthorized')
        )

        // Act
        renderApp('/songs')

        // Assert
        expect(await screen.findByText(
            'Mock Login Page'
        )).toBeInTheDocument()

        expect(screen.queryByText(
            'Mock Song List Page'
        )).not.toBeInTheDocument()
    })

    it('redirects unauthenticated users away from song details', async () => {
        /**
         * Verifies that private song details cannot be accessed
         * without authentication.
         */

        // Arrange
        authAPI.me.mockRejectedValue(
            new Error('Unauthorized')
        )

        // Act
        renderApp('/songs/1')

        // Assert
        expect(await screen.findByText(
            'Mock Login Page'
        )).toBeInTheDocument()

        expect(screen.queryByText(
            'Mock Song Detail Page'
        )).not.toBeInTheDocument()
    })

    it('renders the application footer', async () => {
        /**
         * Verifies that the shared application footer
         * is displayed.
         */

        // Arrange & Act
        renderApp()

        // Assert
        expect(screen.getByText(
            'AI-powered chord detection and tab generation'
        )).toBeInTheDocument()

        await screen.findByText('Mock Home Page')
    })

    it('updates the mobile navigation state', async () => {
        /**
         * Verifies that the navbar can update the application's
         * shared mobile menu state.
         */

        // Arrange
        const user = userEvent.setup()
        renderApp()

        const toggleButton = screen.getByRole('button', {
            name: 'Toggle Menu',
        })

        // Act
        await user.click(toggleButton)

        // Assert
        expect(screen.getByText(
            'Mock Mobile Menu'
        )).toBeInTheDocument()

        // Act
        await user.click(toggleButton)

        // Assert
        expect(screen.queryByText(
            'Mock Mobile Menu'
        )).not.toBeInTheDocument()
    })

    it('observes the navbar height when mounted', async () => {
        /**
         * Verifies that the application observes the navbar
         * to detect changes in its height.
         */

        // Arrange & Act
        renderApp()

        // Assert
        expect(mockObserve).toHaveBeenCalledExactlyOnceWith(
            screen.getByRole('banner')
        )

        await screen.findByText('Mock Home Page')
    })

    it('updates the application layout when the navbar height changes', async () => {
        /**
         * Verifies that navbar resizing updates both the shared
         * CSS variable and standard page padding.
         */

        // Arrange
        renderApp()

        const navbar = screen.getByRole('banner')
        const main = screen.getByRole('main')

        Object.defineProperty(navbar, 'offsetHeight', {
            configurable: true,
            value: 80,
        })

        // Act
        await act(async () => {
            resizeCallback()
        })

        // Assert
        expect(main).toHaveStyle({
            paddingTop: '112px',
        })

        expect(
            navbar.parentElement.style.getPropertyValue('--nav-height')
        ).toBe('80px')
    })

    it.each([
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password/test-uid/test-token/',
    ])(
        'uses authentication page padding for %s',
        async (path) => {
            /**
             * Verifies that authentication pages do not receive
             * the additional standard page padding.
             */

            // Arrange
            renderApp(path)

            const navbar = screen.getByRole('banner')

            Object.defineProperty(navbar, 'offsetHeight', {
                configurable: true,
                value: 80,
            })

            // Act
            await act(async () => {
                resizeCallback()
            })

            // Assert
            expect(screen.getByRole('main')).toHaveStyle({
                paddingTop: '80px',
            })
        }
    )

    it('disconnects the resize observer when unmounted', async () => {
        /**
         * Verifies that layout observers are cleaned up
         * when the application unmounts.
         */

        // Arrange
        const { unmount } = renderApp()

        await act(async () => {})

        // Act
        unmount()

        // Assert
        expect(mockDisconnect).toHaveBeenCalledTimes(1)
    })
})