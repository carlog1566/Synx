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
        <div className="chords-display">
            <h4>Detected Chords:</h4>
            <div className="chords-timeline">
                {chords.map((item, index) => (
                    <div key={index} className="chords-item">
                        <h5>{formatTime(item.time)} - {item.chord}</h5>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ChordDisplay