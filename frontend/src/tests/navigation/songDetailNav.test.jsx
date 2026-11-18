import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SongDetailNav from '../../components/SongDetailNav'

describe('SongDetailNav', () => {
    it('renders the back to library button', () => {
        /** Verifies that users have a way to return to their library. */

        // Arrange & Act
        render(<SongDetailNav onNavigateBack={vi.fn()} />)

        // Assert
        expect(screen.getByRole('button', {
            name: 'Back to Library',
        })).toBeInTheDocument()
    })

    it('invokes the navigation callback when clicked', async () => {
        /** Verifies that the component delegates navigation to its parent. */

        // Arrange
        const user = userEvent.setup()
        const onNavigateBack = vi.fn()

        render(<SongDetailNav onNavigateBack={onNavigateBack} />)

        // Act
        await user.click(screen.getByRole('button', {
            name: 'Back to Library',
        }))

        // Assert
        expect(onNavigateBack).toHaveBeenCalledTimes(1)
    })
})