import { useRef, useEffect } from 'react'
import ChordColumn from './ChordColumn'

const CHORD_WIDTH = 80;
const STRING_SPACING = 30;
const PADDING_LEFT = 40;
const PADDING_TOP = 65;

/**
 * Renders the interactive, audio-synced guitar tab visualization
 * 
 * Displays every detected chord as a column in a horizontally scrollable SVG, auto-scrolling to
 * keep the currently-playing chord centered, and animating a playhead line that smoothly
 * interpolates between chord positions based on currentTime (rather than jumping discretely from
 * chord to chord), see getPlayheadX.
 * 
 * @param {{time: number, chord: string, positions: Object}[]} tabData
 * @param {number} totalTime - full song duration, for the time display
 * @param {number} currentTime - current audio playback position
 * @param {Function} formatDuration - formats seconds as M:SS
 * @param {Function} onSeek - called with a timestamp when a chord column is clicked
 */
const FretboardDisplay = ({ tabData, totalTime, currentTime, formatDuration, onSeek }) => {
    if (!tabData || tabData.length === 0) {
        return (
            <div className="text-center">
                No chords detected for this song!
            </div>
        )
    }
    
    const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];
    const total_width = (tabData.length * CHORD_WIDTH) + PADDING_LEFT;
    const total_height = (STRINGS.length * STRING_SPACING) + PADDING_TOP + 10;
    const scrollContainerRef = useRef(null);

    /**
     * Finds the index of the chord currently playing: the last chord whose time has passed, but
     * before the next chord's time.
     */
    const activeIndex = tabData.findIndex((chord, index) => {
        if ((currentTime >= 0) && (chord['time'] <= currentTime) && (!tabData[index + 1] || tabData[index + 1]['time'] > currentTime)) {
            return true
        } else {
            return false
        }
    })

    useEffect(() => {
        /**
         * Auto-scrolls the fretboard so the active chord stays centered in the visible area as
         * playback progresses.
         */

        if (!scrollContainerRef.current || activeIndex === -1) {
            return
        }

        const activeChordX = activeIndex * CHORD_WIDTH + PADDING_LEFT + (CHORD_WIDTH / 2)
        const containerWidth = scrollContainerRef.current.clientWidth
        const targetScroll = activeChordX - (containerWidth / 2)
        const safeScroll = Math.max(0, targetScroll)

        scrollContainerRef.current.scrollTo({
            left: safeScroll,
            behavior: 'smooth'
        })
    }, [activeIndex])

    /**
     * Calculates the playhead's horizontal position, linearly interpolated between the active chord
     * and the next one based on how far through the current chord's time window playback has
     * progressed. This makes the playhead glide continuously rather than jumping discretely each
     * time activeIndex changes.
     * 
     * Falls back to a fixed position before playback starts (activeIndex === -1) and stays put on
     * the last chord (no nextChord to interpolate toward).
     */
    const getPlayheadX = () => {
        if (activeIndex === -1) {
            return CHORD_WIDTH - (CHORD_WIDTH / 2)
        }

        const currentChord = tabData[activeIndex]
        const nextChord = tabData[activeIndex + 1]
        const currentChordX = activeIndex * CHORD_WIDTH + (CHORD_WIDTH / 2)

        if (!nextChord) {
            return currentChordX
        }

        const timeDiff = nextChord.time - currentChord.time

        if (timeDiff === 0) {
            return currentChordX
        }
        
        const rawProgress = (currentTime - currentChord.time) / timeDiff
        const progress = Math.min(1, Math.max(0, rawProgress))
        const nextChordX = (activeIndex + 1) * CHORD_WIDTH + (CHORD_WIDTH / 2)

        return currentChordX + (progress * (nextChordX - currentChordX))
    }

    const playheadX = getPlayheadX()

    return (
        <>
            <div className="text-center">
                <p>
                    {formatDuration(currentTime)} / {formatDuration(totalTime)}
                </p>
            </div>
            <div ref={scrollContainerRef} className="overflow-x-auto">
                <svg width={total_width} height={total_height}>
                    {STRINGS.map((stringName, index) => {
                        const y = PADDING_TOP + (index * STRING_SPACING)

                        return (
                            <text key={stringName} x={PADDING_LEFT - 10} y={y} textAnchor="end" dominantBaseline="middle">
                                {stringName}
                            </text>
                        )
                    })}

                    {tabData.map((chord, index) => {
                        const isActive = ((currentTime >= 0) && (chord['time'] <= currentTime) && (!tabData[index + 1] || tabData[index + 1]['time'] > currentTime))
                        const xPosition = PADDING_LEFT + (CHORD_WIDTH * index) + (CHORD_WIDTH / 2)
                        
                        return (
                            <ChordColumn 
                                key={chord['time']} 
                                chordData={chord} 
                                xPosition={xPosition} 
                                isActive={isActive}
                                strings={STRINGS}
                                stringSpacing={STRING_SPACING}
                                paddingTop={PADDING_TOP}
                                onSeek={onSeek}
                            />
                        )
                    })}

                    <line
                        x1={playheadX}
                        y1={PADDING_TOP - 60}
                        x2={playheadX}
                        y2={total_height - 15}
                        stroke="#9333ea"
                        strokeWidth={2}
                        opacity={0.5}
                    />
                </svg>
            </div>
        </>
    )
}

export default FretboardDisplay