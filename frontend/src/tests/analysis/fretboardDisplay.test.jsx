import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import FretboardDisplay from '../../components/FretboardDisplay'

/**
 * Isolates fretboard timing and active-chord selection from SVG rendering.
 */
vi.mock('../../components/ChordColumn', () => ({
    default: ({ chordData, isActive, onSeek }) => (
        <g>
            <text onClick={() => onSeek(chordData.time)}>
                {chordData.chord}
            </text>

            {isActive && <text>Active: {chordData.chord}</text>}
        </g>
    ),
}))

const tabData = [
    {
        time: 0,
        chord: 'C',
        positions: { E: 'x', A: '3', D: '2', G: '0', B: '1', e: '0' },
    },
    {
        time: 5,
        chord: 'G',
        positions: { E: '3', A: '2', D: '0', G: '0', B: '0', e: '3' },
    },
    {
        time: 10,
        chord: 'Am',
        positions: { E: 'x', A: '0', D: '2', G: '2', B: '1', e: '0' },
    },
]

/**
 * Formats the timestamps passed to the fretboard.
 */
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainder = Math.trunc(seconds % 60)

    return `${minutes}:${String(remainder).padStart(2, '0')}`
}

/**
 * Renders the fretboard with default progression and playback properties.
 */
function renderFretboard(overrides = {}) {
    const props = {
        tabData,
        totalTime: 60,
        currentTime: 0,
        formatDuration,
        onSeek: vi.fn(),
        ...overrides,
    }

    return {
        ...render(<FretboardDisplay {...props} />),
        props,
    }
}

describe('FretboardDisplay', () => {
    beforeEach(() => {
        /**
         * jsdom does not implement browser scrolling.
         */
        if (!HTMLElement.prototype.scrollTo) {
            HTMLElement.prototype.scrollTo = vi.fn()
        }

        vi.spyOn(HTMLElement.prototype, 'scrollTo')
            .mockImplementation(() => {})
    })

    it('displays a message when chord data is unavailable', () => {
        /** Verifies that missing tablature produces an empty state. */

        // Arrange & Act
        renderFretboard({ tabData: null })

        // Assert
        expect(screen.getByText(
            'No chords detected for this song!'
        )).toBeInTheDocument()
    })

    it('displays a message for an empty chord progression', () => {
        /** Verifies that an empty progression is handled safely. */

        // Arrange & Act
        renderFretboard({ tabData: [] })

        // Assert
        expect(screen.getByText(
            'No chords detected for this song!'
        )).toBeInTheDocument()
    })

    it('displays the chord progression', () => {
        /** Verifies that every supplied chord is rendered. */

        // Arrange & Act
        renderFretboard()

        // Assert
        expect(screen.getByText('C')).toBeInTheDocument()
        expect(screen.getByText('G')).toBeInTheDocument()
        expect(screen.getByText('Am')).toBeInTheDocument()
    })

    it('displays the current and total playback times', () => {
        /** Verifies that playback timestamps are formatted correctly. */

        // Arrange & Act
        renderFretboard({ currentTime: 7 })

        // Assert
        expect(screen.getByText('0:07 / 1:00')).toBeInTheDocument()
    })

    it('selects the first chord at the start of playback', () => {
        /** Verifies that the initial chord becomes active at time zero. */

        // Arrange & Act
        renderFretboard({ currentTime: 0 })

        // Assert
        expect(screen.getByText('Active: C')).toBeInTheDocument()
        expect(screen.queryByText('Active: G')).not.toBeInTheDocument()
    })

    it('updates the active chord as playback progresses', () => {
        /** Verifies that playback time determines the active chord. */

        // Arrange
        const { rerender, props } = renderFretboard()

        // Act
        rerender(<FretboardDisplay {...props} currentTime={6} />)

        // Assert
        expect(screen.getByText('Active: G')).toBeInTheDocument()
        expect(screen.queryByText('Active: C')).not.toBeInTheDocument()
    })

    it('selects the next chord at its exact timestamp', () => {
        /** Verifies correct active-chord behavior at interval boundaries. */

        // Arrange & Act
        renderFretboard({ currentTime: 5 })

        // Assert
        expect(screen.getByText('Active: G')).toBeInTheDocument()
        expect(screen.queryByText('Active: C')).not.toBeInTheDocument()
    })

    it('keeps the final chord active after its timestamp', () => {
        /** Verifies that the final chord remains active until playback ends. */

        // Arrange & Act
        renderFretboard({ currentTime: 30 })

        // Assert
        expect(screen.getByText('Active: Am')).toBeInTheDocument()
    })

    it('does not select a chord before the first timestamp', () => {
        /** Verifies that playback before the progression has no active chord. */

        // Arrange & Act
        renderFretboard({
            tabData: tabData.slice(1),
            currentTime: 0,
        })

        // Assert
        expect(screen.queryByText(/Active:/)).not.toBeInTheDocument()
    })

    it('requests seeking when a chord is selected', async () => {
        /** Verifies that clicking a chord forwards its timestamp. */

        // Arrange
        const user = userEvent.setup()
        const { props } = renderFretboard()

        // Act
        await user.click(screen.getByText('G'))

        // Assert
        expect(props.onSeek).toHaveBeenCalledExactlyOnceWith(5)
    })
})