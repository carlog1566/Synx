import librosa
import numpy as np
import matplotlib.pyplot as plt

class ChordDetector:

    NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    def analyze(self, audio_file_path, step=2.0):
        y, sr = librosa.load(audio_file_path)
        duration = librosa.get_duration(y=y, sr=sr)
        times = np.arange(0, duration, step)

        results = []

        for time in times:
            chord = self._get_chord_at_time(y, sr, time, step)
            
            if chord is None:
                continue

            results.append([{'time': time, 'chord': chord}])

        return results
    
    
    def _get_dominant_chord(self, chroma):
        avg_chroma = np.mean(chroma, axis=1)
        max_index = np.argmax(avg_chroma)

        return self.NOTES[max_index]
    
    
    def _get_chord_at_time(self, y, sr, time, step):
        start_sample = int(time * sr)
        end_sample = min(int((time + step) * sr), len(y))
        segment = y[start_sample:end_sample]

        if len(segment) < sr * 0.1:
            return None
        
        chroma = librosa.feature.chroma_cqt(y=segment, sr=sr)

        chord = self._get_dominant_chord(chroma)

        return chord
    

    def visualize_chroma(self, audio_file_path):
        y, sr = librosa.load(audio_file_path)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)

        plt.figure(figsize=(10, 4))
        librosa.display.specshow(chroma, y_axis='chroma', x_axis='time')
        plt.colorbar()
        plt.title('Chromagram')
        plt.tight_layout()
        plt.show()