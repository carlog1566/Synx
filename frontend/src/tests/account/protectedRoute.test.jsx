import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'

import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../context/AuthContext'

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(),
}))

/**
 * Renders a protected route and its unauthenticated destination.
 */
function renderProtectedRoute() {
    return render(
        <MemoryRouter initialEntries={['/songs']}>
            <Routes>
                <Route
                    path="/songs"
                    element={
                        <ProtectedRoute>
                            <div>Protected Content</div>
                        </ProtectedRoute>
                    }
                />

                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
        </MemoryRouter>
    )
}

describe('ProtectedRoute', () => {
    beforeEach(() => {
        useAuth.mockReset()
    })

    it('renders protected content for an authenticated user', () => {
        /** Verifies that authenticated users can access private routes. */

        // Arrange
        useAuth.mockReturnValue({
            user: { username: 'testuser' },
            loading: false,
        })

        // Act
        renderProtectedRoute()

        // Assert
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
        expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
    })

    it('redirects unauthenticated users to login', async () => {
        /** Verifies that anonymous users cannot access protected content. */

        // Arrange
        useAuth.mockReturnValue({
            user: null,
            loading: false,
        })

        // Act
        renderProtectedRoute()

        // Assert
        expect(await screen.findByText('Login Page')).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('does not render private content while authentication is loading', () => {
        /** Verifies that private content is hidden until authentication finishes. */

        // Arrange
        useAuth.mockReturnValue({
            user: null,
            loading: true,
        })

        // Act
        renderProtectedRoute()

        // Assert
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
        expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
    })
})