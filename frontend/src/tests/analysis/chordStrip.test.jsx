import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'

import ChordStrip from '../../components/ChordStrip'

const { mockSet, frame } = vi.hoisted(() => ({
    mockSet: vi.fn(),
    frame: { callback: null },
}))

/**
 * Controls animation frames without running continuous animations.
 */
vi.mock('framer-motion', async () => {
    const { createElement } = await import('react')
    const motionValue = { set: mockSet }

    return {
        motion: {
            div: ({ children, style, ...props }) => {
                const { x: _x, ...domStyle } = style || {}

                return createElement('div', {
                    ...props,
                    style: domStyle,
                }, children)
            },
        },

        useMotionValue: () => motionValue,

        useAnimationFrame: callback => {
            frame.callback = callback
        },
    }
})

/**
 * Exposes chord preview names and active states.
 */
vi.mock('../../components/MiniChordDiagram', () => ({
    default: ({ chord, isActive }) => (
        <div>
            {chord.name}
            {isActive && <span>Active: {chord.name}</span>}
        </div>
    ),
}))

describe('ChordStrip', () => {
    it('renders two copies of the chord preview sequence', () => {
        /** Verifies that the chord strip supports continuous repetition. */

        // Arrange & Act
        render(<ChordStrip />)

        // Assert
        expect(screen.getAllByText('C')).toHaveLength(2)
        expect(screen.getAllByText('G')).toHaveLength(2)
        expect(screen.getAllByText('Am')).toHaveLength(2)
    })

    it('initially highlights the first chord', () => {
        /** Verifies that the animation starts with the C chord selected. */

        // Arrange & Act
        render(<ChordStrip />)

        // Assert
        expect(screen.getAllByText('Active: C')).toHaveLength(2)
    })

    it('moves the strip as animation time progresses', () => {
        /** Verifies that elapsed time changes the horizontal motion value. */

        // Arrange
        mockSet.mockClear()
        render(<ChordStrip />)

        // Act
        act(() => {
            frame.callback(1000, 1000)
        })

        // Assert
        expect(mockSet).toHaveBeenCalledWith(-45)
    })

    it('updates the active chord when the strip advances', () => {
        /** Verifies that the next chord becomes active as the strip moves. */

        // Arrange
        render(<ChordStrip />)

        // Act
        act(() => {
            frame.callback(2756, 2756)
        })

        // Assert
        expect(screen.getAllByText('Active: G')).toHaveLength(2)
        expect(screen.queryByText('Active: C')).not.toBeInTheDocument()
    })
    
    it('updates the chord strip when its container is resized', () => {
        /**
         * Verifies that resizing the container updates the spacer
         * used to center the active chord.
         */

        // Arrange
        let resizeCallback

        const observe = vi.fn()
        const disconnect = vi.fn()

        const resizeObserverSpy = vi
            .spyOn(globalThis, 'ResizeObserver')
            .mockImplementation(function (callback) {
                resizeCallback = callback
                this.observe = observe
                this.disconnect = disconnect
            })

        const { container, unmount } = render(<ChordStrip />)

        const observedElement = observe.mock.calls[0][0]

        Object.defineProperty(observedElement, 'clientWidth', {
            configurable: true,
            value: 400,
        })

        // Act
        act(() => {
            resizeCallback()
        })

        // Assert
        const chordRow = container.querySelector('[style*="padding-left"]')

        expect(chordRow).toHaveStyle({
            paddingLeft: '152px',
        })

        // Act
        unmount()

        // Assert
        expect(disconnect).toHaveBeenCalledTimes(1)

        resizeObserverSpy.mockRestore()
    })

    it('wraps the animation after completing the entire chord sequence', () => {
        /**
         * Verifies that the chord strip loops back to the first chord
         * after moving through the complete preview sequence.
         */

        // Arrange
        mockSet.mockClear()
        render(<ChordStrip />)

        const totalWidth = 10 * (96 + 28)
        const elapsedTime = ((totalWidth + 10) / 45) * 1000

        // Act
        act(() => {
            frame.callback(elapsedTime, elapsedTime)
        })

        // Assert
        const lastPosition = mockSet.mock.calls.at(-1)[0]

        expect(lastPosition).toBeCloseTo(-10)
        expect(screen.getAllByText('Active: C')).toHaveLength(2)
    })
})