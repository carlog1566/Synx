import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AddSongForm from '../../components/AddSongForm'
import { songAPI } from '../../services/api'

/**
 * Prevents song uploads from reaching the backend.
 */
vi.mock('../../services/api', () => ({
    songAPI: {
        create: vi.fn(),
    },
}))

const mockOnSongAdded = vi.fn()

/**
 * Renders the upload form and retrieves its file input.
 */
function renderAddSongForm() {
    const result = render(
        <AddSongForm onSongAdded={mockOnSongAdded} />
    )

    return {
        ...result,
        fileInput: result.container.querySelector('input[type="file"]'),
    }
}

/**
 * Enters valid song metadata and selects a sample audio file.
 */
async function populateForm(user, fileInput) {
    const file = new File(['fake audio'], 'test.mp3', {
        type: 'audio/mpeg',
    })

    await user.type(screen.getByPlaceholderText('Enter song title'), 'Test Song')
    await user.type(screen.getByPlaceholderText('Enter artist name'), 'Test Artist')
    await user.upload(fileInput, file)

    return file
}

describe('AddSongForm', () => {
    beforeEach(() => {
        songAPI.create.mockReset()
        mockOnSongAdded.mockReset()
    })

    it('renders the song upload form', () => {
        /** Verifies that the metadata fields and upload controls render. */

        // Arrange & Act
        const { fileInput } = renderAddSongForm()

        // Assert
        expect(screen.getByPlaceholderText('Enter song title')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter artist name')).toBeInTheDocument()
        expect(fileInput).toBeInTheDocument()
        expect(fileInput).toHaveAttribute('accept', 'audio/*')
        expect(screen.getByRole('button', { name: /add song/i })).toBeEnabled()
    })

    it('rejects a submission with missing metadata', async () => {
        /** Verifies that empty song information is rejected. */

        // Arrange
        const user = userEvent.setup()
        renderAddSongForm()

        // Act
        await user.click(screen.getByRole('button', { name: /add song/i }))

        // Assert
        expect(screen.getByText('Please fill in all fields!')).toBeInTheDocument()
        expect(songAPI.create).not.toHaveBeenCalled()
    })

    it('rejects a submission without an audio file', async () => {
        /** Verifies that songs cannot be uploaded without audio. */

        // Arrange
        const user = userEvent.setup()
        renderAddSongForm()

        // Act
        await user.type(screen.getByPlaceholderText('Enter song title'), 'Test Song')
        await user.type(screen.getByPlaceholderText('Enter artist name'), 'Test Artist')
        await user.click(screen.getByRole('button', { name: /add song/i }))

        // Assert
        expect(screen.getByText('Please select an audio file!')).toBeInTheDocument()
        expect(songAPI.create).not.toHaveBeenCalled()
    })

    it('displays the selected audio filename', async () => {
        /** Verifies that the selected audio file is displayed. */

        // Arrange
        const user = userEvent.setup()
        const { fileInput } = renderAddSongForm()
        const file = new File(['audio'], 'example.mp3', {
            type: 'audio/mpeg',
        })

        // Act
        await user.upload(fileInput, file)

        // Assert
        expect(screen.getByText(/example\.mp3/)).toBeInTheDocument()
        expect(fileInput.files[0]).toEqual(file)
    })

    it('uploads a song using multipart form data', async () => {
        /** Verifies that song metadata and audio are sent to the API. */

        // Arrange
        const user = userEvent.setup()
        const { fileInput } = renderAddSongForm()

        const newSong = {
            id: 1,
            title: 'Test Song',
            artist: 'Test Artist',
        }

        songAPI.create.mockResolvedValue({ data: newSong })

        // Act
        await populateForm(user, fileInput)
        await user.click(screen.getByRole('button', { name: /add song/i }))

        // Assert
        expect(await screen.findByText('Song added successfully!')).toBeInTheDocument()
        expect(songAPI.create).toHaveBeenCalledTimes(1)

        const submittedData = songAPI.create.mock.calls[0][0]

        expect(submittedData).toBeInstanceOf(FormData)
        expect(submittedData.get('title')).toBe('Test Song')
        expect(submittedData.get('artist')).toBe('Test Artist')
        expect(submittedData.get('audio_file').name).toBe('test.mp3')

        expect(mockOnSongAdded).toHaveBeenCalledExactlyOnceWith(newSong)
    })

    it('clears the form after a successful upload', async () => {
        /** Verifies that the form resets after a song is created. */

        // Arrange
        const user = userEvent.setup()
        const { fileInput } = renderAddSongForm()

        songAPI.create.mockResolvedValue({ data: { id: 1 } })

        // Act
        await populateForm(user, fileInput)
        await user.click(screen.getByRole('button', { name: /add song/i }))

        // Assert
        expect(await screen.findByText('Song added successfully!')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter song title')).toHaveValue('')
        expect(screen.getByPlaceholderText('Enter artist name')).toHaveValue('')
        expect(screen.queryByText(/test\.mp3/)).not.toBeInTheDocument()
    })

    it('displays an error when uploading fails', async () => {
        /** Verifies that failed uploads display an error without adding a song. */

        // Arrange
        const user = userEvent.setup()
        const { fileInput } = renderAddSongForm()

        vi.spyOn(console, 'error').mockImplementation(() => {})
        songAPI.create.mockRejectedValue(new Error('Upload failed'))

        // Act
        await populateForm(user, fileInput)
        await user.click(screen.getByRole('button', { name: /add song/i }))

        // Assert
        expect(await screen.findByText('Error creating song...')).toBeInTheDocument()
        expect(mockOnSongAdded).not.toHaveBeenCalled()
        expect(screen.getByRole('button', { name: /add song/i })).toBeEnabled()
    })

    it('disables upload controls while a request is pending', async () => {
        /** Verifies that duplicate uploads are prevented during submission. */

        // Arrange
        const user = userEvent.setup()
        const { fileInput } = renderAddSongForm()
        let finishUpload

        songAPI.create.mockImplementation(() => new Promise(resolve => {
            finishUpload = resolve
        }))

        // Act
        await populateForm(user, fileInput)
        await user.click(screen.getByRole('button', { name: /add song/i }))

        // Assert
        expect(screen.getByPlaceholderText('Enter song title')).toBeDisabled()
        expect(screen.getByPlaceholderText('Enter artist name')).toBeDisabled()
        expect(fileInput).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Adding...' })).toBeDisabled()

        finishUpload({ data: { id: 1 } })

        expect(await screen.findByText('Song added successfully!')).toBeInTheDocument()
    })

    it('rejects a submission with a missing artist', async () => {
        /**
         * Verifies that providing a title without an artist
         * does not allow song creation.
         */

        // Arrange
        const user = userEvent.setup()
        renderAddSongForm()

        // Act
        await user.type(
            screen.getByPlaceholderText('Enter song title'),
            'Test Song'
        )

        await user.click(screen.getByRole('button', {
            name: /add song/i,
        }))

        // Assert
        expect(screen.getByText(
            'Please fill in all fields!'
        )).toBeInTheDocument()

        expect(songAPI.create).not.toHaveBeenCalled()
    })

    it('removes the success notification after three seconds', async () => {
        /**
         * Verifies that the upload confirmation automatically disappears
         * after its configured three-second timeout.
         */

        // Arrange
        const user = userEvent.setup()
        const { fileInput } = renderAddSongForm()

        songAPI.create.mockResolvedValue({
            data: { id: 1 },
        })

        await populateForm(user, fileInput)

        vi.useFakeTimers()

        try {
            // Act
            await act(async () => {
                fireEvent.click(screen.getByRole('button', {
                    name: /add song/i,
                }))
            })

            // Assert
            expect(screen.getByText(
                'Song added successfully!'
            )).toBeInTheDocument()

            // Act
            await act(async () => {
                await vi.advanceTimersByTimeAsync(2999)
            })

            // Assert
            expect(screen.getByText(
                'Song added successfully!'
            )).toBeInTheDocument()

            // Act
            await act(async () => {
                await vi.advanceTimersByTimeAsync(1)
            })

            // Assert
            expect(screen.queryByText(
                'Song added successfully!'
            )).not.toBeInTheDocument()
        } finally {
            vi.useRealTimers()
        }
    })
})