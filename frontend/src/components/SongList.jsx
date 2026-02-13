import React from "react";
import ChordDisplay from './ChordDisplay';

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    const paddedSecs = secs.toString().padStart(2, '0');
    
    return `${mins}:${paddedSecs}`;
}

function SongList({ songs, onAnalyze, analyzingId }) {
    return (
        <div className="song-list">
            {songs.map((song) => (
                <div key={song.id} className="song-card">
                    <h3>Title: {song.title}</h3>
                    <h4>Artist: {song.artist}</h4>
                    <h5>Duration: {formatDuration(song.duration)}</h5>
                    {song.audio_file && <h5>Audio File Uploaded</h5>}
                    {song.audio_file && !song.analyzed && (
                        <button onClick={() => onAnalyze(song.id)} disabled={analyzingId === song.id}>
                            {analyzingId === song.id ? 'Analyzing...' : 'Analyze Chords'}
                        </button>
                    )}
                    {song.chords && <ChordDisplay chords={song.chords} />}
                </div>
            ))}
        </div>
    )
} 

export default SongList