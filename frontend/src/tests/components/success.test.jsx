import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import Success from '../../components/Success'

describe('Success', () => {
    it('displays the success title and navigation link', () => {
        /** Verifies that successful operations provide a follow-up action. */

        // Arrange & Act
        render(
            <MemoryRouter>
                <Success
                    title="Password reset!"
                    text="Back to login"
                    path="/login"
                />
            </MemoryRouter>
        )

        // Assert
        expect(screen.getByText('Password reset!')).toBeInTheDocument()

        expect(screen.getByRole('link', { name: 'Back to login' }))
            .toHaveAttribute('href', '/login')
    })

    it('displays optional supporting text', () => {
        /** Verifies that additional success information is rendered when supplied. */

        // Arrange & Act
        render(
            <MemoryRouter>
                <Success
                    title="Check your email"
                    subText="A reset link has been sent."
                    text="Back to login"
                    path="/login"
                />
            </MemoryRouter>
        )

        // Assert
        expect(screen.getByText('Check your email')).toBeInTheDocument()
        expect(screen.getByText('A reset link has been sent.'))
            .toBeInTheDocument()
    })
})