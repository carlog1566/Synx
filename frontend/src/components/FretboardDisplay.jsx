import ChordColumn from './ChordColumn'

const FretboardDisplay = ({ tabData, totalTime, currentTime, formatDuration }) => {
    const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];
    const CHORD_WIDTH = 80;
    const STRING_SPACING = 30;
    const PADDING_LEFT = 40;
    const PADDING_TOP = 65;

    const total_width = (tabData.length * CHORD_WIDTH) + PADDING_LEFT;
    const total_height = (STRINGS.length * STRING_SPACING) + PADDING_TOP + 10;

    return (
        <>
            <div className="text-center">
                <p>
                    {formatDuration(currentTime)} / {formatDuration(totalTime)}
                </p>
            </div>
            <div className="overflow-x-auto">
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
                </svg>
            </div>
        </>
    )
}

export default FretboardDisplay