import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'

import ResetPasswordPage from '../../pages/ResetPasswordPage'
import { authAPI } from '../../services/auth'

/**
 * Prevents tests from changing real user passwords.
 */
vi.mock('../../services/auth', () => ({
    authAPI: {
        resetPassword: vi.fn(),
    },
}))

/**
 * Supplies a test UID and reset token through React Router.
 */
function renderResetPasswordPage() {
    return render(
        <MemoryRouter initialEntries={['/reset-password/test-uid/test-token/']}>
            <Routes>
                <Route
                    path="/reset-password/:uid/:token/"
                    element={<ResetPasswordPage />}
                />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
        </MemoryRouter>
    )
}

/**
 * Populates and submits the password reset form.
 */
async function submitReset(user, password, confirmation) {
    await user.type(screen.getByPlaceholderText('New password'), password)
    await user.type(screen.getByPlaceholderText('Confirm new password'), confirmation)
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))
}

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        authAPI.resetPassword.mockReset()
    })

    it('renders the password reset form', () => {
        /**
         * Verifies that both password fields and the submit button are shown.
         */

        // Arrange & Act
        renderResetPasswordPage()

        // Assert
        expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument()
        expect(screen.getByPlaceholderText('New password')).toHaveAttribute('type', 'password')
        expect(screen.getByPlaceholderText('Confirm new password')).toHaveAttribute('type', 'password')
        expect(screen.getByRole('button', { name: 'Reset Password' })).toBeEnabled()
    })

    it('rejects passwords that do not match', async () => {
        /**
         * Verifies that mismatched passwords are rejected before
         * contacting the backend.
         */

        // Arrange
        const user = userEvent.setup()
        renderResetPasswordPage()

        // Act
        await submitReset(user, 'Password123!', 'Different123!')

        // Assert
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
        expect(authAPI.resetPassword).not.toHaveBeenCalled()
    })

    it('resets the password using the UID and token', async () => {
        /**
         * Verifies that the URL parameters and entered password
         * are forwarded to the reset endpoint.
         */

        // Arrange
        const user = userEvent.setup()
        authAPI.resetPassword.mockResolvedValue({})
        renderResetPasswordPage()

        // Act
        await submitReset(user, 'Password123!', 'Password123!')

        // Assert
        expect(authAPI.resetPassword).toHaveBeenCalledExactlyOnceWith(
            'test-uid', 'test-token', 'Password123!'
        )

        expect(await screen.findByText('Password reset!')).toBeInTheDocument()
    })

    it('displays an expired token error', async () => {
        /**
         * Verifies that token validation errors returned by the
         * backend are displayed to the user.
         */

        // Arrange
        const user = userEvent.setup()

        authAPI.resetPassword.mockRejectedValue({
            response: {
                data: { error: 'Invalid or expired token' },
            },
        })

        renderResetPasswordPage()

        // Act
        await submitReset(user, 'Password123!', 'Password123!')

        // Assert
        expect(await screen.findByText('Invalid or expired token')).toBeInTheDocument()
    })

    it('displays multiple password validation errors', async () => {
        /**
         * Verifies that an array of backend errors is rendered completely.
         */

        // Arrange
        const user = userEvent.setup()

        authAPI.resetPassword.mockRejectedValue({
            response: {
                data: {
                    error: [
                        'This password is too short.',
                        'This password is too common.',
                    ],
                },
            },
        })

        renderResetPasswordPage()

        // Act
        await submitReset(user, '123', '123')

        // Assert
        expect(await screen.findByText('This password is too short.')).toBeInTheDocument()
        expect(screen.getByText('This password is too common.')).toBeInTheDocument()
    })

    it('displays a fallback error for unexpected failures', async () => {
        /**
         * Verifies that unexpected errors produce a generic error message.
         */

        // Arrange
        const user = userEvent.setup()
        authAPI.resetPassword.mockRejectedValue(new Error('Network failure'))
        renderResetPasswordPage()

        // Act
        await submitReset(user, 'Password123!', 'Password123!')

        // Assert
        expect(await screen.findByText(
            'Something went wrong. Please try again.'
        )).toBeInTheDocument()
    })

    it('disables password inputs while resetting', async () => {
        /**
         * Verifies that another reset cannot be submitted while
         * a request is already pending.
         */

        // Arrange
        const user = userEvent.setup()
        let finishReset

        authAPI.resetPassword.mockImplementation(() => new Promise(resolve => {
            finishReset = resolve
        }))

        renderResetPasswordPage()

        // Act
        await submitReset(user, 'Password123!', 'Password123!')

        // Assert
        expect(screen.getByPlaceholderText('New password')).toBeDisabled()
        expect(screen.getByPlaceholderText('Confirm new password')).toBeDisabled()
        expect(await screen.findByRole('button', { name: 'Reseting...' })).toBeDisabled()

        finishReset({})

        expect(await screen.findByText('Password reset!')).toBeInTheDocument()
    })

    it('navigates to login after resetting the password', async () => {
        /**
         * Verifies that users can sign in with their newly reset password.
         */

        // Arrange
        const user = userEvent.setup()
        authAPI.resetPassword.mockResolvedValue({})
        renderResetPasswordPage()

        // Act
        await submitReset(user, 'Password123!', 'Password123!')

        await user.click(await screen.findByRole('link', {
            name: 'Log in with your new password',
        }))

        // Assert
        expect(await screen.findByText('Login Page')).toBeInTheDocument()
    })
})