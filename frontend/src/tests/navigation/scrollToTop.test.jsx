import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Link } from 'react-router'

import ScrollToTop from '../../components/ScrollToTop'

describe('ScrollToTop', () => {
    it('scrolls to the top when mounted', () => {
        /** Verifies that navigation starts at the top of the page. */

        // Arrange
        const mockScrollTo = vi.spyOn(window, 'scrollTo')
            .mockImplementation(() => {})

        // Act
        render(
            <MemoryRouter>
                <ScrollToTop />
            </MemoryRouter>
        )

        // Assert
        expect(mockScrollTo).toHaveBeenCalledExactlyOnceWith(0, 0)
    })

    it('scrolls to the top after the path changes', async () => {
        /** Verifies that route changes reset the scroll position. */

        // Arrange
        const user = userEvent.setup()

        const mockScrollTo = vi.spyOn(window, 'scrollTo')
            .mockImplementation(() => {})

        render(
            <MemoryRouter initialEntries={['/']}>
                <ScrollToTop />
                <Link to="/songs">Songs</Link>
            </MemoryRouter>
        )

        mockScrollTo.mockClear()

        // Act
        await user.click(screen.getByRole('link', { name: 'Songs' }))

        // Assert
        expect(mockScrollTo).toHaveBeenCalledExactlyOnceWith(0, 0)
    })
})