import ChordColumn from './ChordColumn'

const FretboardDisplay = ({ tabData, currentTime }) => {
    const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];
    const CHORD_WIDTH = 80;
    const STRING_SPACING = 30;
    const PADDING_LEFT = 40;
    const PADDING_TOP = 40;
    const DOT_RADIUS = 12;

    const total_width = (tabData.length * CHORD_WIDTH) + PADDING_LEFT;
    const total_height = (STRINGS.length * STRING_SPACING) + PADDING_TOP + 40;

    return (
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
            </svg>
        </div>
    )
}

export default FretboardDisplay