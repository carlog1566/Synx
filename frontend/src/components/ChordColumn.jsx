/**
 * Renders one chord's column within FretboardDisplay's SVG: the chord name, a highlighted
 * background when active, one row per string showing its fret position, and a transparent
 * hit-area rect enabling click-to-seek across the whole column.
 * 
 * @param {{chord: string, time: number, positions: Object}} chordData
 * @param {number} xPosition - horizontal center of this column in the SVG
 * @param {boolean} isActive - whether this chord is currently playing
 * @param {string[]} strings - string names, low to high
 * @param {number} stringSpacing - vertical px between string rows
 * @param {number} paddingTop - vertical offset before the first string row
 * @param {Function} onSeek - called with chordData.time when this column is clicked, seeking 
 *  audio playback to that point
 */
const ChordColumn = ({ chordData, xPosition, isActive, strings, stringSpacing, paddingTop, onSeek }) => {

    return (
        <g onClick={() => {onSeek(chordData.time)}}>
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
            
            <rect
                x={xPosition - 40}
                y={paddingTop - 53}
                width={80}
                height={40 + (strings.length * stringSpacing)}
                fill="transparent"
            />
        </g>
    )
}

export default ChordColumn