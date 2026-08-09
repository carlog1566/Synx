import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion'
import MiniChordDiagram from './MiniChordDiagram'

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e']
const CHORD_PREVIEWS = [
    { name: 'C', positions: ['x', '3', '2', '0', '1', '0'] },
    { name: 'G', positions: ['3', '2', '0', '0', '0', '3'] },
    { name: 'Am', positions: ['x', '0', '2', '2', '1', '0'] },
    { name: 'F', positions: ['1', '3', '3', '2', '1', '1'] },
    { name: 'Em', positions: ['0', '2', '2', '0', '0', '0'] },
    { name: 'D', positions: ['x', 'x', '0', '2', '3', '2'] },
    { name: 'A', positions: ['x', '0', '2', '2', '2', '0'] },
    { name: 'E', positions: ['0', '2', '2', '1', '0', '0'] },
    { name: 'Dm', positions: ['x', 'x', '0', '2', '3', '1'] },
    { name: 'G7', positions: ['3', '2', '0', '0', '0', '1'] },
]

const CARD_WIDTH = 96
const CARD_GAP = 28
const STEP_WIDTH = CARD_WIDTH + CARD_GAP
const TOTAL_WIDTH = CHORD_PREVIEWS.length * STEP_WIDTH
const SPEED = 45 // pixels per second

const ChordStrip = () => {
    const containerRef = useRef(null)
    const [panelWidth, setPanelWidth] = useState(572)
    const spacer = panelWidth / 2 - CARD_WIDTH / 2

    const x = useMotionValue(0)
    const distanceRef = useRef(0)
    const activeIndexRef = useRef(0)
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        if (!containerRef.current) return

        const updateWidth = () => {
            setPanelWidth(containerRef.current.clientWidth)
        }

        updateWidth()

        const observer = new ResizeObserver(updateWidth)
        observer.observe(containerRef.current)

        return () => observer.disconnect()
    }, [])

    useAnimationFrame((_, delta) => {
        distanceRef.current += (SPEED * delta) / 1000

        const wrapped = distanceRef.current % TOTAL_WIDTH
        x.set(-wrapped)

        const idx = Math.round(wrapped / STEP_WIDTH) % CHORD_PREVIEWS.length
        if (idx !== activeIndexRef.current) {
            activeIndexRef.current = idx
            setActiveIndex(idx)
        }
    })

    const row = [...CHORD_PREVIEWS, ...CHORD_PREVIEWS]

    return (
        <div className="relative h-56 max-w-[572px] overflow-hidden">
            {/* Fixed Playhead Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-purple-300 -translate-x-1/2 z-10" />
            <div className="absolute left-1/2 -translate-x-1/2  w-2 h-2 rounded-full bg-purple-500 z-10" />

            {/* Scrolling Chords */}
            <div className="absolute inset-0 flex items-center">
                <motion.div className="flex items-center" style={{ x, paddingLeft: spacer }}>
                    {row.map((chord, i) => (
                        <div key={i} style={{ marginRight: CARD_GAP }}>
                            <MiniChordDiagram
                                strings={STRINGS}
                                chord={chord}
                                isActive={i % CHORD_PREVIEWS.length === activeIndex}
                                cardWidth={CARD_WIDTH}
                            />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}

export default ChordStrip