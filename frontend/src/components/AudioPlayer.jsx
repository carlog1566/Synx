import {useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import WaveSurfer from 'wavesurfer.js';

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.trunc(seconds % 60);
    
    const paddedSecs = secs.toString().padStart(2, '0');
    
    return `${mins}:${paddedSecs}`;
}

const AudioPlayer = ({ ref, audioUrl, onTimeUpdate}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(true);
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);

    useImperativeHandle(ref, () => ({
        seekTo: (timeInSeconds) => {
            if (!wavesurfer.current) {
                return
            }

            const duration = wavesurfer.current.getDuration()

            if (!duration) {
                return
            }

            const position = timeInSeconds / duration

            wavesurfer.current.seekTo(position)
            onTimeUpdate(timeInSeconds)
        },

        stop: () => {
            wavesurfer.current.pause()
            wavesurfer.current.destroy()
            wavesurfer.current = null
        }
    }))

    useEffect(() => {
        if (!waveformRef.current) { 
            return
        }

        wavesurfer.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#e5e7eb',
            progressColor: '#9333ea',
            cursorColor: '#ec4848',
            height: 80,
            barWidth: 2,
            barGap: 1,
        })

        wavesurfer.current.load(audioUrl)

        wavesurfer.current.on('play', () => setIsPlaying(true))
        wavesurfer.current.on('pause', () => setIsPlaying(false))
        wavesurfer.current.on('ready', () => {
            setDuration(wavesurfer.current.getDuration())
            setLoading(false)   
        })
        wavesurfer.current.on('audioprocess', () => {
            const time = wavesurfer.current.getCurrentTime()
            onTimeUpdate(time)
            setCurrentTime(time)
        })

        return () => {
            if (wavesurfer.current) {
                wavesurfer.current.destroy()
            }
        }

    }, [audioUrl, onTimeUpdate])

    const handlePlayPause = () => {
        if (!wavesurfer.current) {
            return
        }

        wavesurfer.current.playPause()
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Audio Player</h2>
            
            {/* Waveform */}
            <div ref={waveformRef} className="mb-4"></div>
            
            {/* Controls */}
            <div className="flex items-center justify-between">

                {/* Play/Pause Button */}
                <button onClick={handlePlayPause} disabled={loading} className="bg-fourth hover:bg-primary text-white rounded-full p-4 transition-colors duration-300 cursor-pointer">

                    {loading ? 'Loading...' : (isPlaying ? (
                        // Pause Icon
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        // Play Icon
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    ))}
                </button>
                
                {/* Time Display */}
                <div className="text-gray-600 font-mono">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                </div>
            </div>
        </div>
    )

}

export default AudioPlayer