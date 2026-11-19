import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import ChordDisplay from '../../components/ChordDisplay'

describe('ChordDisplay', () => {
    it('does not render when chords are unavailable', () => {
        /** Verifies that missing chord data does not produce a display. */

        // Arrange & Act
        const { container } = render(<ChordDisplay chords={null} />)

        // Assert
        expect(container).toBeEmptyDOMElement()
    })

    it('does not render an empty chord progression', () => {
        /** Verifies that an empty chord array produces no display. */

        // Arrange & Act
        const { container } = render(<ChordDisplay chords={[]} />)

        // Assert
        expect(container).toBeEmptyDOMElement()
    })

    it('displays detected chords and their timestamps', () => {
        /** Verifies that chord names and formatted timestamps are displayed. */

        // Arrange
        const chords = [
            { time: 0, chord: 'C' },
            { time: 5, chord: 'Am' },
            { time: 65, chord: 'G' },
        ]

        // Act
        render(<ChordDisplay chords={chords} />)

        // Assert
        expect(screen.getByText('Detected Chords')).toBeInTheDocument()
        expect(screen.getByText('C')).toBeInTheDocument()
        expect(screen.getByText('Am')).toBeInTheDocument()
        expect(screen.getByText('G')).toBeInTheDocument()

        expect(screen.getByText('0:00')).toBeInTheDocument()
        expect(screen.getByText('0:05')).toBeInTheDocument()
        expect(screen.getByText('1:05')).toBeInTheDocument()
    })
})