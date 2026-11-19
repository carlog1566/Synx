from unittest.mock import call, patch
import numpy as np
from django.test import TestCase
from songs.chord_detector import ChordDetector


class ChordDetectorTest(TestCase):
    def setUp(self):
        """
        Runs before every test method. Creates a chord detector and example chroma arrays
        that the chord detection tests can reuse.
        """
        self.detector = ChordDetector()
        self.audio_path = 'songs/fake.mp3'
        self.sample_rate = 100
        self.audio = np.ones(300)

        self.c_major_chroma = np.zeros(12)
        self.c_major_chroma[0] = 1.0  # C (root)
        self.c_major_chroma[4] = 0.8  # E (major third)
        self.c_major_chroma[7] = 0.7  # G (fifth)

        self.a_minor_chroma = np.zeros(12)
        self.a_minor_chroma[9] = 1.0  # A (root)
        self.a_minor_chroma[0] = 0.8  # C (minor third)
        self.a_minor_chroma[4] = 0.7  # E (fifth)

    @patch('songs.chord_detector.librosa.get_duration', return_value=3.0)
    @patch('songs.chord_detector.librosa.load')
    @patch.object(ChordDetector, '_get_chord_at_time')
    def test_analyze_returns_chords_at_each_interval(self, mock_get_chord, mock_load, mock_duration):
        """
        Verifies that analyze returns time/chord pairs at the requested intervals.
        """
        # Arrange
        mock_load.return_value = (self.audio, self.sample_rate)
        mock_get_chord.side_effect = ['C', 'Am', 'G']

        # Act
        results = self.detector.analyze(self.audio_path, step=1.0)

        # Assert
        self.assertEqual(len(results), 3)
        self.assertEqual([item['chord'] for item in results], ['C', 'Am', 'G'])
        self.assertEqual([item['time'] for item in results], [0.0, 1.0, 2.0])
        mock_load.assert_called_once_with(self.audio_path)
        mock_duration.assert_called_once()
        mock_get_chord.assert_has_calls([
            call(self.audio, self.sample_rate, 0.0, 1.0),
            call(self.audio, self.sample_rate, 1.0, 1.0),
            call(self.audio, self.sample_rate, 2.0, 1.0),
        ])

    @patch('songs.chord_detector.librosa.get_duration', return_value=3.0)
    @patch('songs.chord_detector.librosa.load')
    @patch.object(ChordDetector, '_get_chord_at_time')
    def test_analyze_skips_undetectable_segments(self, mock_get_chord, mock_load, mock_duration):
        """
        Verifies that segments returning None are excluded from results.
        """
        # Arrange
        mock_load.return_value = (self.audio, self.sample_rate)
        mock_get_chord.side_effect = ['C', None, 'G']

        # Act
        results = self.detector.analyze(self.audio_path, step=1.0)

        # Assert
        self.assertEqual([item['chord'] for item in results], ['C', 'G'])
        self.assertEqual([item['time'] for item in results], [0.0, 2.0])

    @patch('songs.chord_detector.librosa.get_duration', return_value=0.0)
    @patch('songs.chord_detector.librosa.load')
    @patch.object(ChordDetector, '_get_chord_at_time')
    def test_analyze_empty_audio_returns_empty_list(self, mock_get_chord, mock_load, mock_duration):
        """
        Verifies that audio with zero duration produces no chord results.
        """
        # Arrange
        mock_load.return_value = (np.array([]), self.sample_rate)

        # Act
        results = self.detector.analyze(self.audio_path)

        # Assert
        self.assertEqual(results, [])
        mock_get_chord.assert_not_called()

    @patch('songs.chord_detector.librosa.get_duration', return_value=1.0)
    @patch('songs.chord_detector.librosa.load')
    @patch.object(ChordDetector, '_get_chord_at_time', return_value=None)
    def test_analyze_verbose_prints_skipped_segment(self, mock_get_chord, mock_load, mock_duration):
        """
        Verifies verbose analysis reports when a segment is skipped.
        """
        # Arrange
        mock_load.return_value = (self.audio, self.sample_rate)

        # Act
        with patch('builtins.print') as mock_print:
            results = self.detector.analyze(self.audio_path, verbose=True)

        # Assert
        self.assertEqual(results, [])
        mock_print.assert_any_call('0.00s: Skipped - Too quiet/short')

    @patch('songs.chord_detector.librosa.get_duration', return_value=1.0)
    @patch('songs.chord_detector.librosa.load')
    @patch.object(ChordDetector, '_get_chord_at_time', return_value='C')
    def test_analyze_verbose_prints_detected_chord(self, mock_get_chord, mock_load, mock_duration):
        """
        Verifies verbose analysis reports detected chords.
        """
        # Arrange
        mock_load.return_value = (self.audio, self.sample_rate)

        # Act
        with patch('builtins.print') as mock_print:
            results = self.detector.analyze(self.audio_path, verbose=True)

        # Assert
        self.assertEqual(results[0]['chord'], 'C')
        mock_print.assert_any_call('0.00s: C')

    @patch('songs.chord_detector.librosa.feature.chroma_cqt')
    def test_get_chord_at_time_detects_major_chord(self, mock_chroma):
        """
        Verifies that a C-major chroma segment is classified as C.
        """
        # Arrange
        mock_chroma.return_value = np.tile(self.c_major_chroma[:, None], (1, 5))

        # Act
        chord = self.detector._get_chord_at_time(self.audio, self.sample_rate, 0, 1)

        # Assert
        self.assertEqual(chord, 'C')
        mock_chroma.assert_called_once()
        np.testing.assert_array_equal(mock_chroma.call_args.kwargs['y'], self.audio[:100])
        self.assertEqual(mock_chroma.call_args.kwargs['sr'], self.sample_rate)

    @patch('songs.chord_detector.librosa.feature.chroma_cqt')
    def test_get_chord_at_time_detects_minor_chord(self, mock_chroma):
        """
        Verifies that an A-minor chroma segment is classified as Am.
        """
        # Arrange
        mock_chroma.return_value = np.tile(self.a_minor_chroma[:, None], (1, 5))

        # Act
        chord = self.detector._get_chord_at_time(self.audio, self.sample_rate, 0, 1)

        # Assert
        self.assertEqual(chord, 'Am')

    @patch('songs.chord_detector.librosa.feature.chroma_cqt')
    def test_get_chord_at_time_short_segment_returns_none(self, mock_chroma):
        """
        Verifies that segments shorter than 0.1 seconds are ignored.
        """
        # Arrange & Act
        chord = self.detector._get_chord_at_time(self.audio, self.sample_rate, 2.95, 1)

        # Assert
        self.assertIsNone(chord)
        mock_chroma.assert_not_called()

    @patch('songs.chord_detector.librosa.feature.chroma_cqt')
    def test_get_chord_at_time_quiet_chroma_returns_none(self, mock_chroma):
        """V
        erifies that weak chroma energy is treated as undetectable.
        """
        # Arrange
        mock_chroma.return_value = np.full((12, 5), 0.05)

        # Act
        chord = self.detector._get_chord_at_time(self.audio, self.sample_rate, 0, 1)

        # Assert
        self.assertIsNone(chord)

    def test_get_dominant_chord_returns_highest_energy_note(self):
        """
        Verifies that the note with the greatest chroma energy is selected.
        """
        # Arrange
        chroma = np.zeros(12)
        chroma[7] = 0.9  # G

        # Act
        note = self.detector._get_dominant_chord(chroma)

        # Assert
        self.assertEqual(note, 'G')

    def test_detect_chord_quality_major_returns_empty_suffix(self):
        """
        Verifies that a stronger major third yields a major chord suffix.
        """
        # Arrange & Act
        quality = self.detector._detect_chord_quality(self.c_major_chroma)

        # Assert
        self.assertEqual(quality, '')

    def test_detect_chord_quality_minor_returns_m_suffix(self):
        """
        Verifies that a stronger minor third yields the minor chord suffix.
        """
        # Arrange & Act
        quality = self.detector._detect_chord_quality(self.a_minor_chroma)

        # Assert
        self.assertEqual(quality, 'm')

    def test_detect_chord_quality_wraps_note_indices(self):
        """
        Verifies that third intervals wrap correctly around the 12 chroma bins.
        """
        # Arrange
        chroma = np.zeros(12)
        chroma[11] = 1.0  # B root
        chroma[2] = 0.8   # D minor third, wraps to index 2
        chroma[3] = 0.1   # D# major third, wraps to index 3

        # Act
        quality = self.detector._detect_chord_quality(chroma)

        # Assert
        self.assertEqual(quality, 'm')

    @patch('songs.chord_detector.plt.show')
    @patch('songs.chord_detector.plt.tight_layout')
    @patch('songs.chord_detector.plt.title')
    @patch('songs.chord_detector.plt.colorbar')
    @patch('songs.chord_detector.librosa.display.specshow')
    @patch('songs.chord_detector.plt.figure')
    @patch('songs.chord_detector.librosa.feature.chroma_cqt')
    @patch('songs.chord_detector.librosa.load')
    def test_visualize_chroma_displays_chromagram(
        self, mock_load, mock_chroma, mock_figure, mock_specshow,
        mock_colorbar, mock_title, mock_layout, mock_show
    ):
        """
        Verifies that visualization loads audio and displays its chromagram.
        """
        # Arrange
        mock_load.return_value = (self.audio, self.sample_rate)
        chroma = np.ones((12, 5))
        mock_chroma.return_value = chroma

        # Act
        self.detector.visualize_chroma(self.audio_path)

        # Assert
        mock_load.assert_called_once_with(self.audio_path)
        mock_chroma.assert_called_once_with(y=self.audio, sr=self.sample_rate)
        mock_figure.assert_called_once_with(figsize=(10, 4))
        mock_specshow.assert_called_once_with(chroma, y_axis='chroma', x_axis='time')
        mock_colorbar.assert_called_once()
        mock_title.assert_called_once_with('Chromagram')
        mock_layout.assert_called_once()
        mock_show.assert_called_once()