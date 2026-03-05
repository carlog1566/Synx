import React from 'react'

function ChordDisplay({ chords }) {

    if (!chords || chords.length === 0) {
        return null;
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        const paddedSecs = secs.toString().padStart(2, '0');

        return `${mins}:${paddedSecs}`;
    }

    return (
        <div className="mt-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
                Detected Chords
            </h4>
            <div className="flex flex-wrap gap-2">
                {chords.map((chord, index) => (
                    <div 
                        key={index}
                        className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg px-3 py-2 text-sm"
                    >
                        <span className="text-gray-500 text-xs">{formatTime(chord.time)}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="font-bold text-primary">{chord.chord}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ChordDisplay