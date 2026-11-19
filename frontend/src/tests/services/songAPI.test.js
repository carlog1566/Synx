import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import { apiClient, songAPI } from '../../services/api'

const { mockGet, mockPost } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPost: vi.fn(),
}))

/**
 * Provides a mocked Axios client for testing request configuration.
 */
vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({
            get: mockGet,
            post: mockPost,
        })),
    },
}))

describe('songAPI', () => {
    beforeEach(() => {
        mockGet.mockReset()
        mockPost.mockReset()

        mockGet.mockResolvedValue({ data: {} })
        mockPost.mockResolvedValue({ data: {} })
    })

    it.each([
        {
            environmentURL: '',
            expectedURL: '/api',
        },
        {
            environmentURL: 'https://backend.example.com',
            expectedURL: 'https://backend.example.com/api',
        },
    ])(
        'configures the API client using $expectedURL',
        async ({ environmentURL, expectedURL }) => {
            /**
             * Verifies that development and production environments
             * use the correct base URL and authentication settings.
             */

            // Arrange
            vi.stubEnv('VITE_API_URL', environmentURL)
            vi.resetModules()
            axios.create.mockClear()

            try {
                // Act
                await import('../../services/api')

                // Assert
                expect(axios.create).toHaveBeenCalledExactlyOnceWith({
                    baseURL: expectedURL,
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            } finally {
                vi.unstubAllEnvs()
                vi.resetModules()
            }
        }
    )

    it('retrieves all songs', async () => {
        /** Verifies that the song list uses the correct GET endpoint. */

        // Arrange
        const response = {
            data: [{ id: 1, title: 'Test Song' }],
        }

        mockGet.mockResolvedValue(response)

        // Act
        const result = await songAPI.getAll()

        // Assert
        expect(apiClient.get).toHaveBeenCalledExactlyOnceWith('/songs/')
        expect(result).toEqual(response)
    })

    it('retrieves an individual song by ID', async () => {
        /** Verifies that the song ID is included in the request URL. */

        // Arrange & Act
        await songAPI.getById(5)

        // Assert
        expect(apiClient.get).toHaveBeenCalledExactlyOnceWith('/songs/5/')
    })

    it('creates a song using JSON data', async () => {
        /** Verifies that ordinary song data uses JSON content headers. */

        // Arrange
        const songData = {
            title: 'Test Song',
            artist: 'Test Artist',
        }

        // Act
        await songAPI.create(songData)

        // Assert
        expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
            '/songs/',
            songData,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
    })

    it('creates a song using multipart form data', async () => {
        /** Verifies that audio uploads use multipart content headers. */

        // Arrange
        const songData = new FormData()

        songData.append('title', 'Test Song')
        songData.append('audio_file', new File(
            ['audio'],
            'test.mp3',
            { type: 'audio/mpeg' }
        ))

        // Act
        await songAPI.create(songData)

        // Assert
        expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
            '/songs/',
            songData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        )
    })

    it('requests analysis for the selected song', async () => {
        /** Verifies that song analysis uses the correct song ID and endpoint. */

        // Arrange & Act
        await songAPI.analyze(5)

        // Assert
        expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
            '/songs/5/analyze/'
        )
    })

    it('propagates errors from song API requests', async () => {
        /** Verifies that failed requests are not silently discarded. */

        // Arrange
        mockGet.mockRejectedValue(new Error('Network error'))

        // Act & Assert
        await expect(songAPI.getAll()).rejects.toThrow('Network error')
    })
})