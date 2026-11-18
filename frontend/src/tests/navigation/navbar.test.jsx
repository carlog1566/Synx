import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(),
}))

/**
 * Isolates the navbar from the account dropdown.
 */
vi.mock('../../components/UserMenu', () => ({
    default: () => <div>Mock User Menu</div>,
}))

/**
 * Renders the navbar with configurable user and mobile menu states.
 */
function renderNavbar(user = null, menuOpen = false) {
    const setMenuOpen = vi.fn()
    const logout = vi.fn().mockResolvedValue(undefined)

    useAuth.mockReturnValue({ user, logout })

    const result = render(
        <MemoryRouter>
            <Navbar
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
            />
        </MemoryRouter>
    )

    return { ...result, setMenuOpen, logout }
}

describe('Navbar', () => {
    beforeEach(() => {
        vi.resetAllMocks()

        /**
         * Simulates media query support in jsdom.
         */
        vi.stubGlobal('matchMedia', vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })))
    })

    it('displays the application branding and navigation links', () => {
        /** Verifies that the main navigation destinations are available. */

        // Arrange & Act
        renderNavbar()

        // Assert
        expect(screen.getByRole('link', { name: 'Synx' }))
            .toHaveAttribute('href', '/')

        expect(screen.getByRole('link', { name: 'Home' }))
            .toHaveAttribute('href', '/')

        expect(screen.getByRole('link', { name: 'Songs' }))
            .toHaveAttribute('href', '/songs')
    })

    it('displays authentication links for unauthenticated users', () => {
        /** Verifies that anonymous users can access login and registration. */

        // Arrange & Act
        renderNavbar()

        // Assert
        expect(screen.getByRole('link', { name: 'Sign In' }))
            .toHaveAttribute('href', '/login')

        expect(screen.getByRole('link', { name: 'Sign Up' }))
            .toHaveAttribute('href', '/register')

        expect(screen.queryByText('Mock User Menu'))
            .not.toBeInTheDocument()
    })

    it('displays the user menu for authenticated users', () => {
        /** Verifies that authentication changes the displayed controls. */

        // Arrange & Act
        renderNavbar({ username: 'testuser' })

        // Assert
        expect(screen.getByText('Mock User Menu')).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Sign In' }))
            .not.toBeInTheDocument()
    })

    it('requests opening the mobile navigation menu', async () => {
        /** Verifies that the mobile navigation button opens the menu. */

        // Arrange
        const user = userEvent.setup()
        const { setMenuOpen } = renderNavbar()

        // Act
        await user.click(screen.getByRole('button', {
            name: 'Toggle navigation menu',
        }))

        // Assert
        expect(setMenuOpen).toHaveBeenCalledExactlyOnceWith(true)
    })

    it('requests closing the mobile navigation menu', async () => {
        /** Verifies that an open mobile menu can be closed. */

        // Arrange
        const user = userEvent.setup()
        const { setMenuOpen } = renderNavbar(null, true)

        // Act
        await user.click(screen.getByRole('button', {
            name: 'Toggle navigation menu',
        }))

        // Assert
        expect(setMenuOpen).toHaveBeenCalledExactlyOnceWith(false)
    })

    it('displays account controls in the authenticated mobile menu', () => {
        /** Verifies that authenticated mobile users can access their account. */

        // Arrange & Act
        renderNavbar({ username: 'testuser' }, true)

        // Assert
        expect(screen.getByText('Logged in: testuser')).toBeInTheDocument()

        expect(screen.getByRole('link', { name: 'Dashboard' }))
            .toHaveAttribute('href', '/dashboard')

        expect(screen.getByRole('button', { name: 'Logout' }))
            .toBeInTheDocument()
    })

    it('logs out through the mobile navigation menu', async () => {
        /** Verifies that mobile logout invokes authentication and closes the menu. */

        // Arrange
        const user = userEvent.setup()
        const { logout, setMenuOpen } = renderNavbar(
            { username: 'testuser' },
            true
        )

        // Act
        await user.click(screen.getByRole('button', { name: 'Logout' }))

        // Assert
        expect(logout).toHaveBeenCalledTimes(1)
        expect(setMenuOpen).toHaveBeenCalledWith(false)
    })
})