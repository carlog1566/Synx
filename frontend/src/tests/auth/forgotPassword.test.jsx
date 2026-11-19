import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'

import ForgotPasswordPage from '../../pages/ForgotPasswordPage'
import { authAPI } from '../../services/auth'

/**
 * Prevents password recovery tests from sending real reset emails.
 */
vi.mock('../../services/auth', () => ({
    authAPI: {
        forgotPassword: vi.fn(),
    },
}))

/**
 * Renders the forgot password page with a login destination.
 */
function renderForgotPasswordPage() {
    return render(
        <MemoryRouter initialEntries={['/forgot-password']}>
            <Routes>
                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
        </MemoryRouter>
    )
}

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        authAPI.forgotPassword.mockReset()
    })

    it('renders the password recovery form', () => {
        /**
         * Verifies that the email field and recovery controls are displayed.
         */

        // Arrange & Act
        renderForgotPasswordPage()

        // Assert
        expect(screen.getByRole('heading', { name: 'Forgot Password' })).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')
        expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeEnabled()
        expect(screen.getByRole('link', { name: 'Back to login' })).toBeInTheDocument()
    })

    it('submits the email and displays a success message', async () => {
        /**
         * Verifies that a successful recovery request displays a
         * confirmation without disclosing whether the account exists.
         */

        // Arrange
        const user = userEvent.setup()
        authAPI.forgotPassword.mockResolvedValue({})
        renderForgotPasswordPage()

        // Act
        await user.type(screen.getByPlaceholderText('Email'), 'test@email.com')
        await user.click(screen.getByRole('button', { name: 'Send Reset Link' }))

        // Assert
        expect(authAPI.forgotPassword).toHaveBeenCalledExactlyOnceWith('test@email.com')
        expect(await screen.findByText('Check your email')).toBeInTheDocument()

        expect(screen.getByText(
            "If an account exists for that email, we've sent a password reset link."
        )).toBeInTheDocument()
    })

    it('displays an error when the recovery request fails', async () => {
        /**
         * Verifies that network failures display an error and allow retries.
         */

        // Arrange
        const user = userEvent.setup()
        authAPI.forgotPassword.mockRejectedValue(new Error('Network error'))
        renderForgotPasswordPage()

        // Act
        await user.type(screen.getByPlaceholderText('Email'), 'test@email.com')
        await user.click(screen.getByRole('button', { name: 'Send Reset Link' }))

        // Assert
        expect(await screen.findByText(
            'Something went wrong. Please check your connection and try again.'
        )).toBeInTheDocument()

        expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeEnabled()
    })

    it('disables form controls while the request is pending', async () => {
        /**
         * Verifies that repeated submissions are prevented while
         * the recovery request is being processed.
         */

        // Arrange
        const user = userEvent.setup()
        let finishRequest

        authAPI.forgotPassword.mockImplementation(() => new Promise(resolve => {
            finishRequest = resolve
        }))

        renderForgotPasswordPage()

        // Act
        await user.type(screen.getByPlaceholderText('Email'), 'test@email.com')
        await user.click(screen.getByRole('button', { name: 'Send Reset Link' }))

        // Assert
        expect(screen.getByPlaceholderText('Email')).toBeDisabled()
        expect(await screen.findByRole('button', { name: 'Sending...' })).toBeDisabled()

        finishRequest({})

        expect(await screen.findByText('Check your email')).toBeInTheDocument()
    })

    it('navigates back to the login page', async () => {
        /**
         * Verifies that users can return to the login page.
         */

        // Arrange
        const user = userEvent.setup()
        renderForgotPasswordPage()

        // Act
        await user.click(screen.getByRole('link', { name: 'Back to login' }))

        // Assert
        expect(await screen.findByText('Login Page')).toBeInTheDocument()
    })
})