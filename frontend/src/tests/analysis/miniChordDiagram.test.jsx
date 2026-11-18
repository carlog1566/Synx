import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import MiniChordDiagram from '../../components/MiniChordDiagram'

const strings = ['E', 'A', 'D', 'G', 'B', 'e']

const chord = {
    name: 'C',
    positions: ['x', '3', '2', '0', '1', '0'],
}

/**
 * Renders a miniature guitar chord diagram.
 */
function renderDiagram(isActive = false) {
    return render(
        <MiniChordDiagram
            strings={strings}
            chord={chord}
            isActive={isActive}
            cardWidth={96}
        />
    )
}

describe('MiniChordDiagram', () => {
    it('displays the supplied chord name', () => {
        /** Verifies that the chord diagram displays its musical label. */

        // Arrange & Act
        renderDiagram()

        // Assert
        expect(screen.getByText('C')).toBeInTheDocument()
    })

    it('renders muted strings', () => {
        /** Verifies that muted strings display an X marker. */

        // Arrange & Act
        renderDiagram()

        // Assert
        expect(screen.getByText('×')).toBeInTheDocument()
    })

    it('renders open strings as hollow circles', () => {
        /** Verifies that open strings have the correct visual markers. */

        // Arrange & Act
        const { container } = renderDiagram()

        // Assert
        expect(container.querySelectorAll('circle[fill="none"]'))
            .toHaveLength(2)
    })

    it('renders fretted strings as filled circles', () => {
        /** Verifies that finger placements have solid markers. */

        // Arrange & Act
        const { container } = renderDiagram()

        // Assert
        expect(container.querySelectorAll('circle[fill="#9ca3af"]'))
            .toHaveLength(3)
    })

    it('highlights the active chord name', () => {
        /** Verifies that active chords receive the selected visual style. */

        // Arrange & Act
        renderDiagram(true)

        // Assert
        expect(screen.getByText('C')).toHaveClass('text-purple-600')
    })

    it('uses the inactive style for an inactive chord', () => {
        /** Verifies that inactive chord diagrams remain visually distinct. */

        // Arrange & Act
        renderDiagram(false)

        // Assert
        expect(screen.getByText('C')).toHaveClass('text-gray-400')
    })
})