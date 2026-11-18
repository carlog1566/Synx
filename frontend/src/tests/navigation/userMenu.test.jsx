import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'

import UserMenu from '../../components/UserMenu'
import { useAuth } from '../../context/AuthContext'

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(),
}))

const mockLogout = vi.fn()

/**
 * Renders the account menu with test navigation destinations.
 */
function renderUserMenu() {
    return render(
        <MemoryRouter initialEntries={['/songs']}>
            <Routes>
                <Route path="/songs" element={
                    <div>
                        <UserMenu />
                        <p>Outside Menu</p>
                    </div>
                } />

                <Route path="/dashboard" element={<div>Dashboard Page</div>} />
                <Route path="/" element={<div>Home Page</div>} />
            </Routes>
        </MemoryRouter>
    )
}

describe('UserMenu', () => {
    beforeEach(() => {
        vi.resetAllMocks()

        useAuth.mockReturnValue({
            user: { username: 'testuser' },
            logout: mockLogout,
        })
    })

    it('initially hides the account dropdown', () => {
        /** Verifies that the menu is closed by default. */

        // Arrange & Act
        renderUserMenu()

        // Assert
        expect(screen.queryByText('Logged In: testuser'))
            .not.toBeInTheDocument()
    })

    it('displays account controls when opened', async () => {
        /** Verifies that clicking the user icon opens the dropdown. */

        // Arrange
        const user = userEvent.setup()
        renderUserMenu()

        // Act
        await user.click(screen.getByRole('button', { name: '' }))

        // Assert
        expect(screen.getByText('Logged In: testuser')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument()
    })

    it('closes the dropdown when clicked outside', async () => {
        /** Verifies that outside interactions dismiss the menu. */

        // Arrange
        const user = userEvent.setup()
        renderUserMenu()

        await user.click(screen.getByRole('button', { name: '' }))

        // Act
        await user.click(screen.getByText('Outside Menu'))

        // Assert
        expect(screen.queryByText('Logged In: testuser'))
            .not.toBeInTheDocument()
    })

    it('navigates to the account dashboard', async () => {
        /** Verifies that the dashboard link navigates correctly. */

        // Arrange
        const user = userEvent.setup()
        renderUserMenu()

        await user.click(screen.getByRole('button', { name: '' }))

        // Act
        await user.click(screen.getByRole('link', { name: 'Dashboard' }))

        // Assert
        expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
    })

    it('logs out and returns to the home page', async () => {
        /** Verifies that signing out invokes logout and redirects. */

        // Arrange
        const user = userEvent.setup()
        mockLogout.mockResolvedValue(undefined)
        renderUserMenu()

        await user.click(screen.getByRole('button', { name: '' }))

        // Act
        await user.click(screen.getByRole('button', { name: 'Sign Out' }))

        // Assert
        expect(mockLogout).toHaveBeenCalledTimes(1)
        expect(await screen.findByText('Home Page')).toBeInTheDocument()
    })

    it('returns home when logout fails', async () => {
        /** Verifies the menu's fallback navigation after logout failure. */

        // Arrange
        const user = userEvent.setup()
        mockLogout.mockRejectedValue(new Error('Network error'))
        renderUserMenu()

        await user.click(screen.getByRole('button', { name: '' }))

        // Act
        await user.click(screen.getByRole('button', { name: 'Sign Out' }))

        // Assert
        expect(await screen.findByText('Home Page')).toBeInTheDocument()
    })
})