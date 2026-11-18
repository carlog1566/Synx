import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'

import DashboardPage from '../../pages/DashboardPage'
import { authAPI } from '../../services/auth'
import { useAuth } from '../../context/AuthContext'

vi.mock('../../services/auth', () => ({
    authAPI: {
        getStats: vi.fn(),
        changePassword: vi.fn(),
        deleteAccount: vi.fn(),
    },
}))

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(),
}))

const mockLogout = vi.fn()
const mockClearUser = vi.fn()

const defaultUser = {
    username: 'testuser',
    email: 'test@email.com',
    date_joined: '2026-01-15T12:00:00Z',
    has_password: true,
}

/**
 * Renders the account dashboard with customizable authentication state.
 */
function renderDashboard(user = defaultUser) {
    useAuth.mockReturnValue({
        user,
        logout: mockLogout,
        clearUser: mockClearUser,
    })

    return render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/" element={<div>Home Page</div>} />
            </Routes>
        </MemoryRouter>
    )
}

/**
 * Populates the password form and submits the requested change.
 */
async function submitPasswordChange(user, hasPassword = true) {
    if (hasPassword) {
        await user.type(
            screen.getByPlaceholderText('Current password'),
            'OldPassword123!'
        )
    }

    await user.type(
        screen.getByPlaceholderText('New password'),
        'NewPassword123!'
    )

    await user.type(
        screen.getByPlaceholderText('Confirm password'),
        'NewPassword123!'
    )

    await user.click(screen.getByRole('button', {
        name: hasPassword ? 'Change Password' : 'Set Password',
    }))
}

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()

        authAPI.getStats.mockResolvedValue({
            data: {
                total_songs: 8,
                analyzed_songs: 5,
            },
        })
    })

    it('displays the authenticated user profile', async () => {
        /** Verifies that the dashboard displays account information. */

        // Arrange & Act
        renderDashboard()

        // Assert
        expect(screen.getByRole('heading', {
            name: 'Your Account',
        })).toBeInTheDocument()

        expect(screen.getByText('testuser', { exact: false })).toBeInTheDocument()
        expect(screen.getByText('test@email.com', { exact: false })).toBeInTheDocument()

        await screen.findByText('Total songs')
    })

    it('displays the users song statistics', async () => {
        /** Verifies that fetched library statistics are displayed. */

        // Arrange & Act
        renderDashboard()

        // Assert
        expect(await screen.findByText('8')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(authAPI.getStats).toHaveBeenCalledTimes(1)
    })

    it('does not display the dashboard without an authenticated user', async () => {
        /** Verifies that private account information is not rendered. */

        // Arrange & Act
        renderDashboard(null)

        // Assert
        expect(screen.queryByText('Your Account')).not.toBeInTheDocument()
    })

    it('logs out and navigates to the home page', async () => {
        /** Verifies that signing out invokes logout and redirects. */

        // Arrange
        const user = userEvent.setup()
        mockLogout.mockResolvedValue(undefined)
        renderDashboard()

        // Act
        await user.click(screen.getByRole('button', { name: 'Sign Out' }))

        // Assert
        expect(mockLogout).toHaveBeenCalledTimes(1)
        expect(await screen.findByText('Home Page')).toBeInTheDocument()
    })

    it('navigates home even when logout fails', async () => {
        /** Verifies that the dashboard redirects after a logout error. */

        // Arrange
        const user = userEvent.setup()
        mockLogout.mockRejectedValue(new Error('Network error'))
        renderDashboard()

        // Act
        await user.click(screen.getByRole('button', { name: 'Sign Out' }))

        // Assert
        expect(await screen.findByText('Home Page')).toBeInTheDocument()
    })

    it('changes the password successfully', async () => {
        /** Verifies that password changes submit credentials and clear fields. */

        // Arrange
        const user = userEvent.setup()
        authAPI.changePassword.mockResolvedValue({})
        renderDashboard()

        // Act
        await submitPasswordChange(user)

        // Assert
        expect(authAPI.changePassword).toHaveBeenCalledExactlyOnceWith(
            'OldPassword123!',
            'NewPassword123!',
            'NewPassword123!'
        )

        expect(await screen.findByText(
            'Password changed successfully!'
        )).toBeInTheDocument()

        expect(screen.getByPlaceholderText('Current password')).toHaveValue('')
        expect(screen.getByPlaceholderText('New password')).toHaveValue('')
        expect(screen.getByPlaceholderText('Confirm password')).toHaveValue('')
    })

    it('allows Google users to create a password', async () => {
        /** Verifies that accounts without passwords do not require an old password. */

        // Arrange
        const user = userEvent.setup()
        authAPI.changePassword.mockResolvedValue({})

        renderDashboard({
            ...defaultUser,
            has_password: false,
        })

        // Act
        await submitPasswordChange(user, false)

        // Assert
        expect(screen.queryByPlaceholderText('Current password'))
            .not.toBeInTheDocument()

        expect(authAPI.changePassword).toHaveBeenCalledExactlyOnceWith(
            '',
            'NewPassword123!',
            'NewPassword123!'
        )

        expect(await screen.findByText(
            'Password created successfully!'
        )).toBeInTheDocument()
    })

    it('displays password validation errors', async () => {
        /** Verifies that multiple backend errors are displayed. */

        // Arrange
        const user = userEvent.setup()

        authAPI.changePassword.mockRejectedValue({
            response: {
                data: {
                    error: ['Incorrect password.', 'Password is too short.'],
                },
            },
        })

        renderDashboard()

        // Act
        await submitPasswordChange(user)

        // Assert
        expect(await screen.findByText('Incorrect password.')).toBeInTheDocument()
        expect(screen.getByText('Password is too short.')).toBeInTheDocument()
    })

    it('displays a generic error when a password change fails', async () => {
        /** Verifies that unexpected failures display fallback feedback. */

        // Arrange
        const user = userEvent.setup()
        authAPI.changePassword.mockRejectedValue(new Error('Network error'))
        renderDashboard()

        // Act
        await submitPasswordChange(user)

        // Assert
        expect(await screen.findByText(
            'Something went wrong. Please try again.'
        )).toBeInTheDocument()
    })

    it('disables password controls during submission', async () => {
        /** Verifies that duplicate password requests are prevented. */

        // Arrange
        const user = userEvent.setup()
        let finishChange

        authAPI.changePassword.mockImplementation(() => new Promise(resolve => {
            finishChange = resolve
        }))

        renderDashboard()

        // Act
        await submitPasswordChange(user)

        // Assert
        expect(screen.getByPlaceholderText('Current password')).toBeDisabled()
        expect(screen.getByPlaceholderText('New password')).toBeDisabled()
        expect(screen.getByPlaceholderText('Confirm password')).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Changing...' })).toBeDisabled()

        finishChange({})

        expect(await screen.findByText(
            'Password changed successfully!'
        )).toBeInTheDocument()
    })

    it('requires password confirmation before account deletion', async () => {
        /** Verifies that deletion is disabled until a password is entered. */

        // Arrange
        const user = userEvent.setup()
        renderDashboard()

        // Act
        await user.click(screen.getByRole('button', { name: 'Delete Account' }))

        // Assert
        expect(screen.getByPlaceholderText(
            'Enter your password to confirm'
        )).toBeInTheDocument()

        expect(screen.getByRole('button', {
            name: 'Permanently Delete',
        })).toBeDisabled()

        expect(authAPI.deleteAccount).not.toHaveBeenCalled()
    })

    it('cancels an account deletion request', async () => {
        /** Verifies that cancellation clears the deletion confirmation form. */

        // Arrange
        const user = userEvent.setup()
        renderDashboard()

        // Act
        await user.click(screen.getByRole('button', { name: 'Delete Account' }))
        await user.type(
            screen.getByPlaceholderText('Enter your password to confirm'),
            'Password123!'
        )
        await user.click(screen.getByRole('button', { name: 'Cancel' }))
        await user.click(screen.getByRole('button', { name: 'Delete Account' }))

        // Assert
        expect(screen.getByPlaceholderText(
            'Enter your password to confirm'
        )).toHaveValue('')

        expect(authAPI.deleteAccount).not.toHaveBeenCalled()
    })

    it('deletes an account using password confirmation', async () => {
        /** Verifies that successful deletion clears authentication and redirects. */

        // Arrange
        const user = userEvent.setup()
        authAPI.deleteAccount.mockResolvedValue({})
        renderDashboard()

        // Act
        await user.click(screen.getByRole('button', { name: 'Delete Account' }))
        await user.type(
            screen.getByPlaceholderText('Enter your password to confirm'),
            'Password123!'
        )
        await user.click(screen.getByRole('button', {
            name: 'Permanently Delete',
        }))

        // Assert
        expect(authAPI.deleteAccount).toHaveBeenCalledExactlyOnceWith(
            'Password123!', ''
        )
        expect(mockClearUser).toHaveBeenCalledTimes(1)
        expect(await screen.findByText('Home Page')).toBeInTheDocument()
    })

    it('requires exact DELETE confirmation for passwordless accounts', async () => {
        /** Verifies that passwordless deletion requires explicit confirmation. */

        // Arrange
        const user = userEvent.setup()
        authAPI.deleteAccount.mockResolvedValue({})

        renderDashboard({
            ...defaultUser,
            has_password: false,
        })

        // Act
        await user.click(screen.getByRole('button', { name: 'Delete Account' }))

        const confirmation = screen.getByPlaceholderText('DELETE')
        const deleteButton = screen.getByRole('button', {
            name: 'Permanently Delete',
        })

        await user.type(confirmation, 'delete')

        // Assert
        expect(deleteButton).toBeDisabled()

        // Act
        await user.clear(confirmation)
        await user.type(confirmation, 'DELETE')
        expect(deleteButton).toBeEnabled()
        await user.click(deleteButton)

        // Assert
        expect(authAPI.deleteAccount).toHaveBeenCalledExactlyOnceWith(
            '', 'DELETE'
        )
        expect(mockClearUser).toHaveBeenCalledTimes(1)
        expect(await screen.findByText('Home Page')).toBeInTheDocument()
    })

    it('displays an error when account deletion fails', async () => {
        /** Verifies that failed deletion does not clear the authenticated user. */

        // Arrange
        const user = userEvent.setup()

        authAPI.deleteAccount.mockRejectedValue({
            response: {
                data: { error: 'Incorrect password' },
            },
        })

        renderDashboard()

        // Act
        await user.click(screen.getByRole('button', { name: 'Delete Account' }))
        await user.type(
            screen.getByPlaceholderText('Enter your password to confirm'),
            'wrongpassword'
        )
        await user.click(screen.getByRole('button', {
            name: 'Permanently Delete',
        }))

        // Assert
        expect(await screen.findByText('Incorrect password')).toBeInTheDocument()
        expect(mockClearUser).not.toHaveBeenCalled()
    })
})