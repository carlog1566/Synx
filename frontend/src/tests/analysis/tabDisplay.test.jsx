import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import TabDisplay from '../../components/TabDisplay'

const testTabs = {
    guitar: [
        {
            time: 0,
            chord: 'C',
            positions: {
                E: 'x',
                A: '3',
                D: '2',
                G: '0',
                B: '1',
                e: '0',
            },
        },
    ],
}

describe('TabDisplay', () => {
    it('displays a message when tablature is unavailable', () => {
        /** Verifies that missing analysis results display helpful feedback. */

        // Arrange & Act
        render(<TabDisplay tabs={null} instrument="guitar" />)

        // Assert
        expect(screen.getByText(
            'No tabs available for this song yet...'
        )).toBeInTheDocument()

        expect(screen.getByText(
            'Try analyzing the song first!'
        )).toBeInTheDocument()
    })

    it('displays a message for empty guitar tablature', () => {
        /** Verifies that an empty instrument progression is handled. */

        // Arrange & Act
        render(<TabDisplay tabs={{ guitar: [] }} instrument="guitar" />)

        // Assert
        expect(screen.getByText('Guitar tabs not available yet.'))
            .toBeInTheDocument()
    })

    it('displays a message for empty non-guitar tablature', () => {
        /** Verifies that the unavailable message uses the instrument name. */

        // Arrange & Act
        render(<TabDisplay tabs={{ piano: [] }} instrument="piano" />)

        // Assert
        expect(screen.getByText('Piano tabs not available yet.'))
            .toBeInTheDocument()
    })

    it('displays guitar tablature data', () => {
        /** Verifies that chord names, timestamps, and fret positions render. */

        // Arrange & Act
        render(<TabDisplay tabs={testTabs} instrument="guitar" />)

        // Assert
        expect(screen.getByRole('heading', {
            name: 'Guitar Tabs',
        })).toBeInTheDocument()

        expect(screen.getByText('Time: 0')).toBeInTheDocument()
        expect(screen.getByText('Chord: C')).toBeInTheDocument()

        expect(screen.getByText(/Positions:/)).toHaveTextContent(
            /Positions:\s*x\s*3\s*2\s*0\s*1\s*0/
        )
    })

    it('displays multiple chords in the tablature progression', () => {
        /** Verifies that multiple detected chords are rendered. */

        // Arrange
        const tabs = {
            guitar: [
                ...testTabs.guitar,
                {
                    time: 5,
                    chord: 'G',
                    positions: {
                        E: '3', A: '2', D: '0',
                        G: '0', B: '0', e: '3',
                    },
                },
            ],
        }

        // Act
        render(<TabDisplay tabs={tabs} instrument="guitar" />)

        // Assert
        expect(screen.getByText('Chord: C')).toBeInTheDocument()
        expect(screen.getByText('Chord: G')).toBeInTheDocument()
        expect(screen.getByText('Time: 5')).toBeInTheDocument()
    })
})