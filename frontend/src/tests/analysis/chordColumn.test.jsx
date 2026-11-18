import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ChordColumn from '../../components/ChordColumn'

const chordData = {
    time: 5,
    chord: 'C',
    positions: {
        E: 'x',
        A: '3',
        D: '2',
        G: '0',
        B: '1',
        e: '0',
    },
}

/**
 * Renders a chord column inside an SVG container.
 */
function renderChordColumn(overrides = {}) {
    const props = {
        chordData,
        xPosition: 80,
        isActive: false,
        strings: ['E', 'A', 'D', 'G', 'B', 'e'],
        stringSpacing: 30,
        paddingTop: 65,
        onSeek: vi.fn(),
        ...overrides,
    }

    return {
        ...render(
            <svg>
                <ChordColumn {...props} />
            </svg>
        ),
        props,
    }
}

describe('ChordColumn', () => {
    it('displays the chord name and fret positions', () => {
        /** Verifies that the SVG column displays the supplied chord information. */

        // Arrange & Act
        renderChordColumn()

        // Assert
        expect(screen.getByText('C')).toBeInTheDocument()
        expect(screen.getByText('x')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getAllByText('0')).toHaveLength(2)
    })

    it('displays a fallback for missing string positions', () => {
        /** Verifies that incomplete fret positions render a placeholder. */

        // Arrange & Act
        renderChordColumn({
            chordData: {
                ...chordData,
                positions: { E: 'x' },
            },
        })

        // Assert
        expect(screen.getAllByText('-')).toHaveLength(5)
    })

    it('highlights an active chord', () => {
        /** Verifies that active chords display an additional highlight rectangle. */

        // Arrange & Act
        const { container } = renderChordColumn({ isActive: true })

        // Assert
        expect(container.querySelector('rect[fill="#9333ea"]'))
            .toBeInTheDocument()
    })

    it('does not highlight an inactive chord', () => {
        /** Verifies that inactive chords do not display the active rectangle. */

        // Arrange & Act
        const { container } = renderChordColumn({ isActive: false })

        // Assert
        expect(container.querySelector('rect[fill="#9333ea"]'))
            .not.toBeInTheDocument()
    })

    it('requests seeking when the chord is clicked', async () => {
        /** Verifies that clicking a chord forwards its playback timestamp. */

        // Arrange
        const user = userEvent.setup()
        const { props } = renderChordColumn()

        // Act
        await user.click(screen.getByText('C'))

        // Assert
        expect(props.onSeek).toHaveBeenCalledExactlyOnceWith(5)
    })
})