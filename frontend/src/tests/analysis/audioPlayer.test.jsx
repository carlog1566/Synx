import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import AudioPlayer from '../../components/AudioPlayer'

/**
 * Provides a simulated WaveSurfer instance and its event callbacks.
 */
const { mockWaveSurfer, mockCreate, events } = vi.hoisted(() => {
    const events = {}

    const mockWaveSurfer = {
        load: vi.fn(),
        on: vi.fn(),
        getDuration: vi.fn(),
        getCurrentTime: vi.fn(),
        playPause: vi.fn(),
        setPlaybackRate: vi.fn(),
        seekTo: vi.fn(),
        pause: vi.fn(),
        destroy: vi.fn(),
    }

    return {
        events,
        mockWaveSurfer,
        mockCreate: vi.fn(() => mockWaveSurfer),
    }
})

vi.mock('wavesurfer.js', () => ({
    default: {
        create: mockCreate,
    },
}))

const audioUrl = 'https://example.com/test.mp3'

/**
 * Renders AudioPlayer and exposes its imperative interface.
 */
function renderAudioPlayer() {
    const ref = createRef()
    const onTimeUpdate = vi.fn()

    const result = render(
        <AudioPlayer
            ref={ref}
            audioUrl={audioUrl}
            onTimeUpdate={onTimeUpdate}
        />
    )

    return { ...result, ref, onTimeUpdate }
}

/**
 * Simulates WaveSurfer completing audio initialization.
 */
function emitReady() {
    act(() => {
        events.ready()
    })
}

describe('AudioPlayer', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        Object.keys(events).forEach(key => {
            delete events[key]
        })

        mockWaveSurfer.getDuration.mockReturnValue(120)
        mockWaveSurfer.getCurrentTime.mockReturnValue(15)

        mockWaveSurfer.on.mockImplementation((event, callback) => {
            events[event] = callback
        })
    })

    it('initializes WaveSurfer and loads the audio URL', () => {
        /** Verifies that the player initializes with the supplied audio file. */

        // Arrange & Act
        renderAudioPlayer()

        // Assert
        expect(mockCreate).toHaveBeenCalledTimes(1)
        expect(mockWaveSurfer.load).toHaveBeenCalledExactlyOnceWith(audioUrl)
        expect(screen.getByRole('heading', {
            name: 'Audio Player',
        })).toBeInTheDocument()
    })

    it('disables playback until the audio is ready', () => {
        /** Verifies that playback cannot begin before initialization finishes. */

        // Arrange & Act
        renderAudioPlayer()

        // Assert
        expect(screen.getByRole('button', {
            name: 'Loading...',
        })).toBeDisabled()
    })

    it('displays audio duration after initialization', () => {
        /** Verifies that the ready event updates the displayed duration. */

        // Arrange
        renderAudioPlayer()

        // Act
        emitReady()

        // Assert
        expect(screen.getByText('0:00 / 2:00')).toBeInTheDocument()
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('toggles playback when the playback button is clicked', async () => {
        /** Verifies that the playback control calls WaveSurfer.playPause. */

        // Arrange
        const user = userEvent.setup()
        renderAudioPlayer()
        emitReady()

        // Act
        await user.click(screen.getByRole('button', { name: '' }))

        // Assert
        expect(mockWaveSurfer.playPause).toHaveBeenCalledTimes(1)
    })

    it('updates playback state when audio plays and pauses', () => {
        /** Verifies that playback events change the displayed control icon. */

        // Arrange
        renderAudioPlayer()
        emitReady()

        const playButton = screen.getByRole('button', { name: '' })
        const initialIcon = playButton.querySelector('path').getAttribute('d')

        // Act
        act(() => {
            events.play()
        })

        // Assert
        expect(playButton.querySelector('path').getAttribute('d'))
            .not.toBe(initialIcon)

        // Act
        act(() => {
            events.pause()
        })

        // Assert
        expect(playButton.querySelector('path').getAttribute('d'))
            .toBe(initialIcon)
    })

    it('updates and reports the current audio playback time', () => {
        /** Verifies that audio processing events synchronize playback time. */

        // Arrange
        const { onTimeUpdate } = renderAudioPlayer()
        emitReady()

        // Act
        act(() => {
            events.audioprocess()
        })

        // Assert
        expect(screen.getByText('0:15 / 2:00')).toBeInTheDocument()
        expect(onTimeUpdate).toHaveBeenCalledExactlyOnceWith(15)
    })

    it('changes the audio playback speed', async () => {
        /** Verifies that selecting a speed updates WaveSurfer playback rate. */

        // Arrange
        const user = userEvent.setup()
        renderAudioPlayer()
        emitReady()

        // Act
        await user.click(screen.getByRole('button', { name: '1.5x' }))

        // Assert
        expect(mockWaveSurfer.setPlaybackRate)
            .toHaveBeenCalledExactlyOnceWith(1.5)
    })

    it('seeks to the requested position', () => {
        /** Verifies that seeking converts seconds into normalized audio progress. */

        // Arrange
        const { ref, onTimeUpdate } = renderAudioPlayer()
        emitReady()

        // Act
        act(() => {
            ref.current.seekTo(30)
        })

        // Assert
        expect(mockWaveSurfer.seekTo).toHaveBeenCalledExactlyOnceWith(0.25)
        expect(onTimeUpdate).toHaveBeenCalledExactlyOnceWith(30)
    })

    it('does not seek when the audio duration is unavailable', () => {
        /** Verifies that seeking avoids division by zero. */

        // Arrange
        mockWaveSurfer.getDuration.mockReturnValue(0)
        const { ref } = renderAudioPlayer()

        // Act
        act(() => {
            ref.current.seekTo(30)
        })

        // Assert
        expect(mockWaveSurfer.seekTo).not.toHaveBeenCalled()
    })

    it('pauses and destroys WaveSurfer when stopped', () => {
        /** Verifies that stopping releases the current playback instance. */

        // Arrange
        const { ref, unmount } = renderAudioPlayer()

        // Act
        act(() => {
            ref.current.stop()
        })

        // Assert
        expect(mockWaveSurfer.pause).toHaveBeenCalledTimes(1)
        expect(mockWaveSurfer.destroy).toHaveBeenCalledTimes(1)

        unmount()

        expect(mockWaveSurfer.destroy).toHaveBeenCalledTimes(1)
    })

    it('destroys WaveSurfer when the component unmounts', () => {
        /** Verifies that unmounting releases playback resources. */

        // Arrange
        const { unmount } = renderAudioPlayer()

        // Act
        unmount()

        // Assert
        expect(mockWaveSurfer.destroy).toHaveBeenCalledTimes(1)
    })
})