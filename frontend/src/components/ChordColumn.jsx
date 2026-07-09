const ChordColumn = ({ chordData, xPosition, isActive, strings, stringSpacing, paddingTop, dotRadius}) => {
    return (
        <g>
            <text x={xPosition} y={0}>{chordData.chord}</text>
        </g>
    )
}

export default ChordColumn