import librosa
import numpy as np
import matplotlib.pyplot as plt

class ChordDetector:
    """
    The ChordDetector class contains the methods used to detect/visualize chords in audio
    """

    NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


    def analyze(self, audio_file_path, step=1.0):
        """
        This method is the main method used to analyze chords within audio/songs
        
        Parameters
        ----------
        audio_file_path : str
            The designated file path for the desired audio file to be analyzed
        step : float, optional
            The time interval in seconds between consecutive chord analysis frames (default is 2.0)

        Returns
        -------
        results
            A list of chords at certain time intervals specified by step
        """

        y, sr = librosa.load(audio_file_path)
        duration = librosa.get_duration(y=y, sr=sr)
        times = np.arange(0, duration, step)

        results = []

        for time in times:
            chord = self._get_chord_at_time(y, sr, time, step)
            
            if chord is None:
                continue

            results.append({'time': time, 'chord': chord})

        return results
    
    
    def _get_chord_at_time(self, y, sr, time, step):
        """
        This method extracts the most dominant chord from an audio segment at a specific time

        Parameters
        ----------
        y : np.array
            A NumPy array that contains the amplitude values of the audio signal over time
        sr : int
            Represents the number of samples per second of the audio time series
        time : float
            The start time of the specific audio segment
        step : float
            The duration of the analysis window in seconds

        Returns
        -------
        chord
            The most prominent chord from the audio segment
        """

        start_sample = int(time * sr)
        end_sample = min(int((time + step) * sr), len(y))
        segment = y[start_sample:end_sample]

        if len(segment) < sr * 0.1:
            return None
        
        chroma = librosa.feature.chroma_cqt(y=segment, sr=sr)
        avg_chroma = np.mean(chroma, axis=1)
        
        chord = self._get_dominant_chord(avg_chroma)
        quality = self._detect_chord_quality(avg_chroma)

        return f'{chord}{quality}'
    

    def _get_dominant_chord(self, avg_chroma):
        """
        This method is used to obtain themost dominant chord based on the chroma (frequency representation)

        Parameters
        ----------
        avg_chroma : np.ndarray
            The chrorma features already averaged on axis=1 using np.mean() of an audio (1 dimensional array)
            The entire spectrum of an audio signal divided into 12 bins (notes)

        Returns
        -------
        str
            The note with the most prominent energy/frequency, based on self.NOTES
        """
        max_index = np.argmax(avg_chroma)

        return self.NOTES[max_index]
    

    def _detect_chord_quality(self, avg_chroma):
        """
        This method is used to determine whether the chord is a minor or major chord
        Based on the strength of major 3rd vs minor 3rd

        Parameters
        ----------
        avg_chroma : np.ndarray
            The chrorma features already averaged on axis=1 using np.mean() of an audio (1 dimensional array)
            The entire spectrum of an audio signal divided into 12 bins (notes)
        
        Returns
        -------
        str
            'm' or '' depending on if the chord is a minor or major
        """
        root_idx = np.argmax(avg_chroma)

        major_third_idx = (root_idx + 4) % 12
        minor_third_idx = (root_idx + 3) % 12

        major_strength = avg_chroma[major_third_idx]
        minor_strength = avg_chroma[minor_third_idx]

        if minor_strength > (major_strength * 1.2):
            return 'm'
        else:
            return ''


    def visualize_chroma(self, audio_file_path):
        """
        This method visualizes the chroma features of a specific audio file

        Parameters
        ----------
        audio_file_path : str
            The designated file path for the desired audio file to be visualized
        """
        
        y, sr = librosa.load(audio_file_path)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)

        plt.figure(figsize=(10, 4))
        librosa.display.specshow(chroma, y_axis='chroma', x_axis='time')
        plt.colorbar()
        plt.title('Chromagram')
        plt.tight_layout()
        plt.show()