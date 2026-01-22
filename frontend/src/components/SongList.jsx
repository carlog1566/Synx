import React from "react";

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    const paddedSecs = secs.toString().padStart(2, '0');
    
    return `${mins}:${paddedSecs}`;
}

function SongList({ songs }) {
    return (
        <div className="song-list">
            {songs.map((song) => (
                <div key={song.id} className="song-card">
                    <h3>Title: {song.title}</h3>
                    <h4>Artist: {song.artist}</h4>
                    <h5>Duration: {formatDuration(song.duration)}</h5>
                </div>
            ))}
        </div>
    )
} 

export default SongList