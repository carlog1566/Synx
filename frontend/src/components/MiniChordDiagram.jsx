import { motion } from 'framer-motion'

const MiniChordDiagram = ({ strings, chord, isActive, cardWidth}) => {
    const w = 72
    const h = 88
    const stringGap = w / 5
    const fretGap = 20
    const topPad = 18

    return (
        <motion.div
            animate={{ scale: isActive ? 1.15 : 0.9, opacity: isActive ? 1 : 0.35 }}
            transition={{ duration: 0.25 }}
            className="flex-shrink-0 flex flex-col items-center"
            style={{ width: cardWidth }}
        >
            <p className={`text-sm font-bold mb-2 transition-colors ${isActive ? 'text-purple-600' : 'text-gray-400'}`}>
                {chord.name}
            </p>
            <svg width={w + 10} height={h}>
                {/* Nut */}
                <rect x={5} y={topPad} width={w} height={2.5} fill={isActive ? '#9333ea' : '#d1d5db'} />

                {/* Fret Lines */}
                {[1, 2, 3].map(f => (
                    <line
                        key={f}
                        x1={5} y1={topPad + f * fretGap}
                        x2={w} y2={topPad + f * fretGap}
                        stroke="#e5e7eb" strokeWidth={1}
                    />
                ))}

                {/* String Lines */}
                {strings.map((s, i) => (
                    <line
                        key={s}
                        x1={(i * stringGap) + 5} y1={topPad}
                        x2={(i * stringGap) + 5} y2={topPad + 3 * fretGap}
                        stroke="#e5e7eb" strokeWidth={1}
                    />
                ))}

                {/* Markers */}
                {chord.positions.map((pos, i) => {
                    const x = i * stringGap
                    if (pos === 'x') {
                        return (
                            <text key={i} x={x + 5} y={topPad - 5} textAnchor="middle" fontSize="9" fill="#f87171" fontWeight="bold">
                                ×
                            </text>
                        )
                    }
                    if (pos === '0') {
                        return (
                            <circle
                                key={i} cx={x + 5} cy={topPad - 7} r={3.5}
                                fill="none"
                                stroke={isActive ? '#9333ea' : '#9ca3af'}
                                strokeWidth={1.5}
                            />
                        )
                    }
                    const fretNum = parseInt(pos)
                    const y = topPad + (fretNum - 0.5) * fretGap
                    return (
                        <circle
                            key={i} cx={x + 5} cy={y} r={4.5}
                            fill={isActive ? '#9333ea' : '#9ca3af'}
                        />
                    )
                })}
            </svg>
        </motion.div>
    )
}

export default MiniChordDiagram