import { useRef, useEffect, act } from 'react'
import ChordColumn from './ChordColumn'

const CHORD_WIDTH = 80;
const STRING_SPACING = 30;
const PADDING_LEFT = 40;
const PADDING_TOP = 65;

const FretboardDisplay = ({ tabData, totalTime, currentTime, formatDuration }) => {
    const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];
    const total_width = (tabData.length * CHORD_WIDTH) + PADDING_LEFT;
    const total_height = (STRINGS.length * STRING_SPACING) + PADDING_TOP + 10;

    const scrollContainerRef = useRef(null);
    const activeIndex = tabData.findIndex((chord, index) => {
        if ((currentTime >= 0) && (chord['time'] <= currentTime) && (!tabData[index + 1] || tabData[index + 1]['time'] > currentTime)) {
            return true
        } else {
            return false
        }
    })

    useEffect(() => {
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

    const getPlayheadX = () => {
        if (activeIndex === -1) {
            return CHORD_WIDTH - (CHORD_WIDTH / 2)
        }

        const currentChord = tabData[activeIndex]
        const nextChord = tabData[activeIndex + 1]
        const currentChordX = activeIndex * CHORD_WIDTH + (CHORD_WIDTH / 2)
        const timeDiff = nextChord.time - currentChord.time

        if (!nextChord || timeDiff === 0) {
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
                                formatDuration={formatDuration}
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