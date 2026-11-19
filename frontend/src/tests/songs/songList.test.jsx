import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'

import SongListPage from '../../pages/SongListPage'
import { songAPI } from '../../services/api'

vi.mock('../../services/api', () => ({
    songAPI: {
        getAll: vi.fn(),
        analyze: vi.fn(),
    },
}))

const { newSong } = vi.hoisted(() => ({
    newSong: {
        id: 2,
        title: 'New Song',
        artist: 'New Artist',
        duration: 150,
        audio_file: 'songs/new.mp3',
        analyzed: false,
    },
}))

/**
 * Simulates successful song creation with and without audio.
 */
vi.mock('../../components/AddSongForm', () => ({
    default: ({ onSongAdded }) => (
        <div>
            <button onClick={() => onSongAdded(newSong)}>
                Mock Add Song
            </button>

            <button onClick={() => onSongAdded({
                ...newSong,
                audio_file: null,
            })}>
                Mock Add Song Without Audio
            </button>
        </div>
    ),
}))

const existingSong = {
    id: 1,
    title: 'Existing Song',
    artist: 'Existing Artist',
    duration: 125,
    audio_file: 'songs/existing.mp3',
    analyzed: false,
}

function renderSongList() {
    return render(
        <MemoryRouter initialEntries={['/songs']}>
            <Routes>
                <Route path="/songs" element={<SongListPage />} />
            </Routes>
        </MemoryRouter>
    )
}

describe('SongListPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('displays a loading indicator while fetching songs', async () => {
        /** Verifies that loading feedback appears before the request completes. */

        // Arrange
        let finishRequest
        songAPI.getAll.mockImplementation(() => new Promise(resolve => {
            finishRequest = resolve
        }))

        // Act
        renderSongList()

        // Assert
        expect(screen.getByText('Loading...')).toBeInTheDocument()

        finishRequest({ data: [] })

        expect(await screen.findByText('No songs yet!')).toBeInTheDocument()
    })

    it('displays the retrieved songs', async () => {
        /** Verifies that songs returned by the API appear in the library. */

        // Arrange
        songAPI.getAll.mockResolvedValue({ data: [existingSong] })

        // Act
        renderSongList()

        // Assert
        expect(await screen.findByText('Existing Song')).toBeInTheDocument()
        expect(screen.getByText('Existing Artist')).toBeInTheDocument()
        expect(screen.getByText('2:05')).toBeInTheDocument()
        expect(songAPI.getAll).toHaveBeenCalledTimes(1)
    })

    it('displays an empty library message', async () => {
        /** Verifies that an empty response displays the correct empty state. */

        // Arrange
        songAPI.getAll.mockResolvedValue({ data: [] })

        // Act
        renderSongList()

        // Assert
        expect(await screen.findByText('No songs yet!')).toBeInTheDocument()
        expect(screen.getByText('Upload your first song to get started.'))
            .toBeInTheDocument()
    })

    it('displays an error when retrieving songs fails', async () => {
        /** Verifies that failed library requests display error feedback. */

        // Arrange
        songAPI.getAll.mockRejectedValue(new Error('Unable to load songs'))

        // Act
        renderSongList()

        // Assert
        expect(await screen.findByText('Unable to load songs')).toBeInTheDocument()
        expect(screen.getByText('ERROR!')).toBeInTheDocument()
    })

    it('updates a song after successful analysis', async () => {
        /** Verifies that analysis results replace the previous song state. */

        // Arrange
        const user = userEvent.setup()
        songAPI.getAll.mockResolvedValue({ data: [existingSong] })

        songAPI.analyze.mockResolvedValue({
            data: { ...existingSong, analyzed: true },
        })

        renderSongList()

        // Act
        await user.click(await screen.findByRole('button', {
            name: 'Analyze Chords',
        }))

        // Assert
        expect(songAPI.analyze).toHaveBeenCalledExactlyOnceWith(1)
        expect(await screen.findByText('Analysis complete')).toBeInTheDocument()
    })

    it('displays analysis progress while a request is pending', async () => {
        /** Verifies that a song displays its analyzing state during processing. */

        // Arrange
        const user = userEvent.setup()
        let finishAnalysis

        songAPI.getAll.mockResolvedValue({ data: [existingSong] })
        songAPI.analyze.mockImplementation(() => new Promise(resolve => {
            finishAnalysis = resolve
        }))

        renderSongList()

        // Act
        await user.click(await screen.findByRole('button', {
            name: 'Analyze Chords',
        }))

        // Assert
        expect(screen.getByText('Analyzing chords...')).toBeInTheDocument()

        finishAnalysis({
            data: { ...existingSong, analyzed: true },
        })

        expect(await screen.findByText('Analysis complete')).toBeInTheDocument()
    })

    it('displays an error when song analysis fails', async () => {
        /** Verifies that failed analysis produces page-level error feedback. */

        // Arrange
        const user = userEvent.setup()
        songAPI.getAll.mockResolvedValue({ data: [existingSong] })
        songAPI.analyze.mockRejectedValue(new Error('Analysis failed'))

        renderSongList()

        // Act
        await user.click(await screen.findByRole('button', {
            name: 'Analyze Chords',
        }))

        // Assert
        expect(await screen.findByText('Analysis failed')).toBeInTheDocument()
    })

    it('automatically analyzes a newly uploaded song', async () => {
        /** Verifies that uploading audio triggers automatic analysis. */

        // Arrange
        const user = userEvent.setup()
        songAPI.getAll.mockResolvedValue({ data: [] })
        songAPI.analyze.mockResolvedValue({
            data: { ...newSong, analyzed: true },
        })

        renderSongList()

        // Act
        await user.click(await screen.findByRole('button', {
            name: 'Mock Add Song',
        }))

        // Assert
        expect(await screen.findByText('New Song')).toBeInTheDocument()
        expect(songAPI.analyze).toHaveBeenCalledExactlyOnceWith(2)
        expect(await screen.findByText('Analysis complete')).toBeInTheDocument()
    })
    
    it('preserves other songs when analyzing a selected song', async () => {
        /**
         * Verifies that successful analysis only updates the selected
         * song and preserves the remaining library contents.
         */

        // Arrange
        const user = userEvent.setup()

        const otherSong = {
            ...existingSong,
            id: 3,
            title: 'Another Song',
            artist: 'Another Artist',
            analyzed: true,
        }

        songAPI.getAll.mockResolvedValue({
            data: [existingSong, otherSong],
        })

        songAPI.analyze.mockResolvedValue({
            data: {
                ...existingSong,
                analyzed: true,
            },
        })

        renderSongList()

        // Act
        await user.click(await screen.findByRole('button', {
            name: 'Analyze Chords',
        }))

        // Assert
        expect(songAPI.analyze).toHaveBeenCalledExactlyOnceWith(1)
        expect(screen.getByText('Existing Song')).toBeInTheDocument()
        expect(screen.getByText('Another Song')).toBeInTheDocument()
        expect(screen.getByText('Another Artist')).toBeInTheDocument()

        await waitFor(() => {
            expect(screen.getAllByText('Analysis complete')).toHaveLength(2)
        })
    })

    it('handles analysis failure in a library containing multiple songs', async () => {
        /**
         * Verifies that analysis failure is handled when the library
         * contains both the selected song and other songs.
         */

        // Arrange
        const user = userEvent.setup()

        const otherSong = {
            ...existingSong,
            id: 3,
            title: 'Another Song',
            analyzed: true,
        }

        songAPI.getAll.mockResolvedValue({
            data: [existingSong, otherSong],
        })

        songAPI.analyze.mockRejectedValue(
            new Error('Analysis failed')
        )

        renderSongList()

        // Act
        await user.click(await screen.findByRole('button', {
            name: 'Analyze Chords',
        }))

        // Assert
        expect(songAPI.analyze).toHaveBeenCalledExactlyOnceWith(1)
        expect(await screen.findByText('Analysis failed')).toBeInTheDocument()
    })

    it('does not automatically analyze a new song without audio', async () => {
        /**
         * Verifies that automatic analysis only occurs when the
         * newly created song contains an audio file.
         */

        // Arrange
        const user = userEvent.setup()

        songAPI.getAll.mockResolvedValue({
            data: [],
        })

        renderSongList()

        // Act
        await user.click(await screen.findByRole('button', {
            name: 'Mock Add Song Without Audio',
        }))

        // Assert
        expect(await screen.findByText('New Song')).toBeInTheDocument()
        expect(songAPI.analyze).not.toHaveBeenCalled()
    })
})