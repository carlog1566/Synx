import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import Song from '../../components/Song'

const defaultSong = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    duration: 125,
    audio_file: 'songs/test.mp3',
    analyzed: false,
    analysis_failed: false,
}

/**
 * Renders a song card with customizable song and analysis states.
 */
function renderSong(songOverrides = {}, analyzingIds = []) {
    const handleAnalyze = vi.fn()
    const formatDuration = vi.fn(() => '2:05')

    render(
        <MemoryRouter>
            <Song
                song={{ ...defaultSong, ...songOverrides }}
                analyzingIds={analyzingIds}
                handleAnalyze={handleAnalyze}
                formatDuration={formatDuration}
            />
        </MemoryRouter>
    )

    return { handleAnalyze, formatDuration }
}

describe('Song', () => {
    it('displays the song information', () => {
        /** Verifies that the card displays metadata and audio availability. */

        // Arrange & Act
        const { formatDuration } = renderSong()

        // Assert
        expect(screen.getByRole('heading', { name: 'Test Song' })).toBeInTheDocument()
        expect(screen.getByText('Test Artist')).toBeInTheDocument()
        expect(screen.getByText('2:05')).toBeInTheDocument()
        expect(screen.getByText('Audio file uploaded')).toBeInTheDocument()
        expect(formatDuration).toHaveBeenCalledWith(125)
    })

    it('provides a link to the song details', () => {
        /** Verifies that the song card links to its detail route. */

        // Arrange & Act
        renderSong()

        // Assert
        expect(screen.getByRole('link', { name: /test song/i }))
            .toHaveAttribute('href', '/1')
    })

    it('does not display a duration of zero', () => {
        /** Verifies that unknown duration information is omitted. */

        // Arrange & Act
        const { formatDuration } = renderSong({ duration: 0 })

        // Assert
        expect(formatDuration).not.toHaveBeenCalled()
        expect(screen.queryByText('2:05')).not.toBeInTheDocument()
    })

    it('requests analysis when the analyze button is clicked', async () => {
        /** Verifies that the selected song ID is passed to analysis. */

        // Arrange
        const user = userEvent.setup()
        const { handleAnalyze } = renderSong()

        // Act
        await user.click(screen.getByRole('button', { name: 'Analyze Chords' }))

        // Assert
        expect(handleAnalyze).toHaveBeenCalledExactlyOnceWith(1)
    })

    it('does not allow analysis without an uploaded audio file', () => {
        /** Verifies that songs without audio do not show an analyze button. */

        // Arrange & Act
        renderSong({ audio_file: null })

        // Assert
        expect(screen.queryByText('Audio file uploaded')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {
            name: 'Analyze Chords',
        })).not.toBeInTheDocument()
    })

    it('displays a pending analysis indicator', () => {
        /** Verifies that an ongoing analysis hides the normal analyze button. */

        // Arrange & Act
        renderSong({}, [1])

        // Assert
        expect(screen.getByText('Analyzing chords...')).toBeInTheDocument()
        expect(screen.queryByRole('button', {
            name: 'Analyze Chords',
        })).not.toBeInTheDocument()
    })

    it('displays completed analysis status', () => {
        /** Verifies that an analyzed song displays its completed state. */

        // Arrange & Act
        renderSong({ analyzed: true })

        // Assert
        expect(screen.getByText('Analysis complete')).toBeInTheDocument()
        expect(screen.queryByRole('button', {
            name: 'Analyze Chords',
        })).not.toBeInTheDocument()
    })

    it('allows failed analysis to be retried', async () => {
        /** Verifies that the retry button requests analysis again. */

        // Arrange
        const user = userEvent.setup()
        const { handleAnalyze } = renderSong({ analysis_failed: true })

        // Act
        await user.click(screen.getByRole('button', {
            name: 'Analysis Failed - Retry',
        }))

        // Assert
        expect(handleAnalyze).toHaveBeenCalledExactlyOnceWith(1)
    })

    it('disables the retry button during analysis', () => {
        /** Verifies that another retry cannot start while analysis is pending. */

        // Arrange & Act
        renderSong({ analysis_failed: true }, [1])

        // Assert
        expect(screen.getByRole('button', { name: 'Analyzing...' })).toBeDisabled()
    })
})