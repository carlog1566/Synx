import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import Error from '../../components/Error'

describe('Error', () => {
    it('displays the supplied error message', () => {
        /** Verifies that the component renders the error provided by its parent. */

        // Arrange & Act
        render(<Error error="Unable to load songs" />)

        // Assert
        expect(screen.getByRole('heading', {
            name: 'ERROR!',
        })).toBeInTheDocument()

        expect(screen.getByText('Unable to load songs')).toBeInTheDocument()
    })
})