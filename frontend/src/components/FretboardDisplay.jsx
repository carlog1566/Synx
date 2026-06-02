const FretboardDisplay = ({ tabData, currentTime }) => {
    const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];
    const CHORD_WIDTH = 80;
    const STRING_SPACING = 30;
    const PADDING_LEFT = 40;
    const PADDING_TOP = 40;
    const DOT_RADIUS = 12;

    const total_width = tab_data.length * CHORD_WIDTH + PADDING_LEFT;
    const total_height = STRINGS.length * STRING_SPACING + PADDING_TOP;

    return (
        <div className="overflow-x-auto">
            <svg width={total_width} heigth={total_height}>
                
            </svg>
        </div>
    )
}

export default FretboardDisplay