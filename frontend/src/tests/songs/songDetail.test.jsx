import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'

import SongDetailPage from '../../pages/SongDetailPage'
import { songAPI } from '../../services/api'

vi.mock('../../services/api', () => ({
    songAPI: {
        getById: vi.fn(),
    },
}))

const { mockSeek, mockStop } = vi.hoisted(() => ({
    mockSeek: vi.fn(),
    mockStop: vi.fn(),
}))

/**
 * Mocks audio playback while preserving the player's imperative interface.
 */
vi.mock('../../components/AudioPlayer', async () => {
    const { useImperativeHandle } = await import('react')

    function MockAudioPlayer({ ref, audioUrl, onTimeUpdate }) {
        useImperativeHandle(ref, () => ({
            seekTo: mockSeek,
            stop: mockStop,
        }))

        return (
            <div>
                <p>{audioUrl}</p>

                <button onClick={() => onTimeUpdate(10)}>
                    Mock Playback Update
                </button>
            </div>
        )
    }

    return { default: MockAudioPlayer }
})

/**
 * Isolates the details page from the fretboard implementation.
 */
vi.mock('../../components/FretboardDisplay', () => ({
    default: ({ tabData, currentTime, onSeek }) => (
        <div>
            <p>Mock Fretboard</p>
            <p>Playback time: {currentTime}</p>

            {tabData.map(chord => (
                <button
                    key={chord.time}
                    onClick={() => onSeek(chord.time)}
                >
                    Seek to {chord.chord}
                </button>
            ))}
        </div>
    ),
}))

const testSong = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    duration: 125,
    audio_file_url: 'https://example.com/test.mp3',
    analyzed: true,
    tabs: {
        guitar: [
            {
                time: 5,
                chord: 'C',
                positions: {
                    E: 'x', A: '3', D: '2',
                    G: '0', B: '1', e: '0',
                },
            },
        ],
    },
}

/**
 * Renders a song details route with a specific song ID.
 */
function renderSongDetail() {
    return render(
        <MemoryRouter initialEntries={['/songs/1']}>
            <Routes>
                <Route path="/songs/:id" element={<SongDetailPage />} />
                <Route path="/songs" element={<div>Song Library</div>} />
            </Routes>
        </MemoryRouter>
    )
}

describe('SongDetailPage', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('displays a loading indicator while retrieving a song', async () => {
        /** Verifies that the page displays loading feedback. */

        // Arrange
        let finishRequest

        songAPI.getById.mockImplementation(() => new Promise(resolve => {
            finishRequest = resolve
        }))

        // Act
        renderSongDetail()

        // Assert
        expect(screen.getByText('Loading...')).toBeInTheDocument()

        finishRequest({ data: testSong })

        expect(await screen.findByText('Test Song')).toBeInTheDocument()
    })

    it('retrieves and displays the requested song', async () => {
        /** Verifies that the route ID is used to retrieve song details. */

        // Arrange
        songAPI.getById.mockResolvedValue({ data: testSong })

        // Act
        renderSongDetail()

        // Assert
        expect(await screen.findByText('Test Song')).toBeInTheDocument()
        expect(screen.getByText('By: Test Artist')).toBeInTheDocument()
        expect(screen.getByText('2:05')).toBeInTheDocument()
        expect(screen.getByText('Analyzed')).toBeInTheDocument()
        expect(songAPI.getById).toHaveBeenCalledExactlyOnceWith('1')
    })

    it('displays an error when retrieving the song fails', async () => {
        /** Verifies that unsuccessful requests display error feedback. */

        // Arrange
        songAPI.getById.mockRejectedValue(new Error('Song retrieval failed'))

        // Act
        renderSongDetail()

        // Assert
        expect(await screen.findByText('Song retrieval failed')).toBeInTheDocument()
    })

    it('displays a not-found message when no song is returned', async () => {
        /** Verifies that a null song response is handled gracefully. */

        // Arrange
        songAPI.getById.mockResolvedValue({ data: null })

        // Act
        renderSongDetail()

        // Assert
        expect(await screen.findByText('Song Not Found')).toBeInTheDocument()
    })

    it('displays a warning when a song has not been analyzed', async () => {
        /** Verifies that analysis-dependent controls are hidden. */

        // Arrange
        songAPI.getById.mockResolvedValue({
            data: {
                ...testSong,
                analyzed: false,
                tabs: null,
            },
        })

        // Act
        renderSongDetail()

        // Assert
        expect(await screen.findByText(
            "This song hasn't been analyzed yet"
        )).toBeInTheDocument()

        expect(screen.queryByText('Mock Fretboard')).not.toBeInTheDocument()
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('displays the audio player and fretboard for an analyzed song', async () => {
        /** Verifies that analyzed songs expose playback and tablature controls. */

        // Arrange
        songAPI.getById.mockResolvedValue({ data: testSong })

        // Act
        renderSongDetail()

        // Assert
        expect(await screen.findByText('Mock Fretboard')).toBeInTheDocument()
        expect(screen.getByText(testSong.audio_file_url)).toBeInTheDocument()
        expect(screen.getByRole('combobox')).toHaveValue('guitar')
    })

    it('does not display an audio player without an audio URL', async () => {
        /** Verifies that missing audio URLs do not mount the player. */

        // Arrange
        songAPI.getById.mockResolvedValue({
            data: {
                ...testSong,
                audio_file_url: null,
            },
        })

        // Act
        renderSongDetail()

        // Assert
        expect(await screen.findByText('Test Song')).toBeInTheDocument()
        expect(screen.queryByRole('button', {
            name: 'Mock Playback Update',
        })).not.toBeInTheDocument()
    })

    it('passes playback updates to the fretboard', async () => {
        /** Verifies that the fretboard receives the current audio time. */

        // Arrange
        const user = userEvent.setup()
        songAPI.getById.mockResolvedValue({ data: testSong })
        renderSongDetail()

        // Act
        await user.click(await screen.findByRole('button', {
            name: 'Mock Playback Update',
        }))

        // Assert
        expect(screen.getByText('Playback time: 10')).toBeInTheDocument()
    })

    it('seeks the audio player when a chord is selected', async () => {
        /** Verifies that selecting a chord seeks to its timestamp. */

        // Arrange
        const user = userEvent.setup()
        songAPI.getById.mockResolvedValue({ data: testSong })
        renderSongDetail()

        // Act
        await user.click(await screen.findByRole('button', {
            name: 'Seek to C',
        }))

        // Assert
        expect(mockSeek).toHaveBeenCalledExactlyOnceWith(5)
    })

    it('stops playback before returning to the library', async () => {
        /** Verifies that navigation stops the current audio player. */

        // Arrange
        const user = userEvent.setup()
        songAPI.getById.mockResolvedValue({ data: testSong })
        renderSongDetail()

        await screen.findByText('Test Song')

        // Act
        await user.click(screen.getByRole('button', {
            name: 'Back to Library',
        }))

        // Assert
        expect(mockStop).toHaveBeenCalledTimes(1)
        expect(await screen.findByText('Song Library')).toBeInTheDocument()
    })
})