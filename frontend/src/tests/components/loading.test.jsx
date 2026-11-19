import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import Loading from '../../components/Loading'

describe('Loading', () => {
    it('displays loading feedback', () => {
        /** Verifies that users receive feedback during pending operations. */

        // Arrange & Act
        render(<Loading />)

        // Assert
        expect(screen.getByRole('heading', {
            name: 'Loading...',
        })).toBeInTheDocument()
    })
})