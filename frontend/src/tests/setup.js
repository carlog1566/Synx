import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

/**
 * Replaces animated elements with standard HTML elements.
 * Allows tests to focus on functionality instead of animation timing.
 */
vi.mock('framer-motion', async () => {
    const { createElement } = await import('react')
    const components = {}

    return {
        motion: new Proxy({}, {
            get: (_, tag) => {
                if (!components[tag]) {
                    components[tag] = ({
                        children,
                        initial: _initial,
                        animate: _animate,
                        exit: _exit,
                        transition: _transition,
                        whileHover: _whileHover,
                        whileTap: _whileTap,
                        variants: _variants,
                        layout: _layout,
                        ...props
                    }) => createElement(tag, props, children)
                }

                return components[tag]
            }
        }),
        AnimatePresence: ({ children }) => children,
    }
})

/**
 * Removes rendered components and resets spies after each test.
 */
afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
})