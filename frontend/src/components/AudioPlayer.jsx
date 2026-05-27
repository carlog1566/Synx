import {useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

const AudioPlayer = ({ audioUrl }) => {
    waveformRef = useRef(null);
    wavesurfer = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {

    }, [audioUrl])

    const handlePlayPause = () => {

    }

    return (
        <div>

        </div>
    )

}

export default AudioPlayer