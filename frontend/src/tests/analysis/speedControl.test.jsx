import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SpeedControl from '../../components/SpeedControl'

describe('SpeedControl', () => {
    it('renders all supported playback speeds', () => {
        /** Verifies that all supported speed controls are available. */

        // Arrange & Act
        render(
            <SpeedControl currentSpeed={1} onSpeedChange={vi.fn()} />
        )

        // Assert
        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

        speeds.forEach(speed => {
            expect(screen.getByRole('button', {
                name: `${speed}x`,
            })).toBeInTheDocument()
        })
    })

    it('requests a new playback speed when a button is clicked', async () => {
        /** Verifies that desktop speed controls forward a numerical speed. */

        // Arrange
        const user = userEvent.setup()
        const onSpeedChange = vi.fn()

        render(
            <SpeedControl currentSpeed={1} onSpeedChange={onSpeedChange} />
        )

        // Act
        await user.click(screen.getByRole('button', { name: '1.5x' }))

        // Assert
        expect(onSpeedChange).toHaveBeenCalledExactlyOnceWith(1.5)
    })

    it('requests a new speed through the mobile dropdown', async () => {
        /** Verifies that dropdown values are converted into numbers. */

        // Arrange
        const user = userEvent.setup()
        const onSpeedChange = vi.fn()

        render(
            <SpeedControl currentSpeed={1} onSpeedChange={onSpeedChange} />
        )

        // Act
        await user.selectOptions(screen.getByRole('combobox'), '0.75')

        // Assert
        expect(onSpeedChange).toHaveBeenCalledExactlyOnceWith(0.75)
    })

    it('reflects the selected playback speed', () => {
        /** Verifies that the dropdown reflects the current speed property. */

        // Arrange & Act
        render(
            <SpeedControl currentSpeed={1.25} onSpeedChange={vi.fn()} />
        )

        // Assert
        expect(screen.getByRole('combobox')).toHaveValue('1.25')
    })
})