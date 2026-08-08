const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2]

const SpeedControl = ({ currentSpeed, onSpeedChange }) => {
    return (
        <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium text-sm">
                Speed:
            </span>

            <div className="flex gap-2">
                {SPEED_OPTIONS.map(speed => (
                    <button
                        key={speed}
                        onClick={() => onSpeedChange(speed)}
                        className={`
                            px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer
                            ${currentSpeed === speed ? 'bg-fourth text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                        `}
                    >
                        {speed}x
                    </button>
                ))}
            </div>
        </div>
    )
}

export default SpeedControl