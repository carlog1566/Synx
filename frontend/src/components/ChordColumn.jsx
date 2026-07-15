const ChordColumn = ({ chordData, xPosition, isActive, strings, stringSpacing, paddingTop, formatDuration }) => {

    return (
        <g>
            <text x={xPosition} y={paddingTop - 30} textAnchor="middle">{chordData['chord']}</text>
            {isActive && (
                <rect
                    x={xPosition - 40}
                    y={paddingTop - 53}
                    width={80}
                    height={40 + (strings.length * stringSpacing)}
                    fill="#9333ea"
                    opacity={0.1}
                    rx={10}
                />
            )}
            {strings.map((stringName, stringIndex) => {
                const y = paddingTop + (stringIndex * stringSpacing)
                const fret = chordData["positions"][stringName] ?? '-'
                const color = isActive ? "#9333ea" : "#6b7280"
        
                return(
                    <g key={stringName}>
                        <line
                            x1={xPosition - 40}
                            x2={xPosition + 40}
                            y1={y}
                            y2={y}
                            stroke="#d1d5db"
                            strokeWidth={1}
                        />
                        <text
                            x={xPosition}
                            y={y} 
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={15}
                            fill={color}
                        >
                            {fret}
                        </text>
                    </g>
                )
            })}
        </g>
    )
}

export default ChordColumn