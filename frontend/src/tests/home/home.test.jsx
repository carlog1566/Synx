import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import HomePage from '../../pages/HomePage'

/**
 * Isolates the landing page from the animated chord preview.
 */
vi.mock('../../components/ChordStrip', () => ({
    default: () => <div>Mock Chord Strip</div>,
}))

describe('HomePage', () => {
    it('displays the application branding and description', () => {
        /** Verifies that the landing page introduces Synx. */

        // Arrange & Act
        render(<HomePage />)

        // Assert
        expect(screen.getByRole('heading', {
            name: 'Synx',
        })).toBeInTheDocument()

        expect(screen.getByText(
            'Turn any song into interactive tabs'
        )).toBeInTheDocument()
    })

    it('provides links to the song library', () => {
        /** Verifies that the main calls to action point to the song library. */

        // Arrange & Act
        render(<HomePage />)

        // Assert
        expect(screen.getByRole('link', { name: /get started/i }))
            .toHaveAttribute('href', '/songs')

        expect(screen.getByRole('link', { name: /start analyzing songs/i }))
            .toHaveAttribute('href', '/songs')
    })

    it('provides a link to the features section', () => {
        /** Verifies that the learn-more control targets the features section. */

        // Arrange & Act
        const { container } = render(<HomePage />)

        // Assert
        expect(screen.getByRole('link', { name: 'Learn More' }))
            .toHaveAttribute('href', '#features')

        expect(container.querySelector('#features')).toBeInTheDocument()
    })

    it('displays the three main application workflow steps', () => {
        /** Verifies that the landing page explains the analysis workflow. */

        // Arrange & Act
        render(<HomePage />)

        // Assert
        expect(screen.getByText('1. Upload Your Song')).toBeInTheDocument()
        expect(screen.getByText('2. AI Chord Detection')).toBeInTheDocument()
        expect(screen.getByText('3. Interactive Tabs')).toBeInTheDocument()
    })

    it('displays the chord preview', () => {
        /** Verifies that the landing page includes the chord preview component. */

        // Arrange & Act
        render(<HomePage />)

        // Assert
        expect(screen.getByText('Mock Chord Strip')).toBeInTheDocument()
    })
})