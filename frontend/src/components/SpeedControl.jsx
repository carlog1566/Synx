const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2]

const SpeedControl = ({ currentSpeed, onSpeedChange }) => {
    return (
        <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium text-sm">
                Speed:
            </span>

            <div className="hidden md:flex gap-2">
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

            {/* Mobile */}
            <select
                value={currentSpeed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                className="md:hidden px-3 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 text-sm font-medium transition-all duration-300 focus:border-purple-600 focus:outline-none"
            >
                {SPEED_OPTIONS.map(speed => (
                    <option key={speed} value={speed}>
                        {speed}x
                    </option>
                ))}
            </select>
        </div>
    )
}

export default SpeedControl