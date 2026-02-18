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
    
    
    def _get_dominant_chord(self, chroma):
        """
        This method is used to obtain themost dominant chord based on the chroma (frequency representation)

        Parameters
        ----------
        chroma : np.ndarray
            The chroma features of an audio; the entire spectrum of an audio signal divided into 12 bins

        Returns
        -------
        str
            The note with the most prominent energy/frequency, based on self.NOTES
        """

        avg_chroma = np.mean(chroma, axis=1)
        max_index = np.argmax(avg_chroma)

        return self.NOTES[max_index]
    
    
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

        chord = self._get_dominant_chord(chroma)

        return chord
    

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