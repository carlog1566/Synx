from django.test import SimpleTestCase
from songs.tab_generator import TabGenerator


class TabGeneratorTest(SimpleTestCase):
    def setUp(self):
        """
        Creates the generator and reusable chord progressions for every test.
        """
        self.generator = TabGenerator()
        self.chords = [
            {'time': 0, 'chord': 'C'},
            {'time': 2, 'chord': 'Am'},
            {'time': 4, 'chord': 'G'},
        ]

    def test_generate_returns_structured_tabs(self):
        """
        Verifies that known chords produce time, chord, and string positions.
        """
        # Arrange & Act
        result = self.generator.generate(self.chords)

        # Assert
        self.assertEqual(result, [
            {'time': 0, 'chord': 'C', 'positions': {
                'E': 'x', 'A': '3', 'D': '2', 'G': '0', 'B': '1', 'e': '0'}},
            {'time': 2, 'chord': 'Am', 'positions': {
                'E': 'x', 'A': '0', 'D': '2', 'G': '2', 'B': '1', 'e': '0'}},
            {'time': 4, 'chord': 'G', 'positions': {
                'E': '3', 'A': '2', 'D': '0', 'G': '0', 'B': '0', 'e': '3'}},
        ])

    def test_generate_preserves_repeated_chords(self):
        """
        Verifies that repeated chords retain their individual timestamps.
        """
        # Arrange
        chords = [{'time': 0, 'chord': 'C'}, {'time': 3, 'chord': 'C'}]

        # Act
        result = self.generator.generate(chords)

        # Assert
        self.assertEqual(len(result), 2)
        self.assertEqual([item['time'] for item in result], [0, 3])
        self.assertEqual([item['chord'] for item in result], ['C', 'C'])

    def test_generate_empty_chords_returns_empty_list(self):
        """
        Verifies that no input chords produce no structured tabs.
        """
        # Arrange & Act
        result = self.generator.generate([])

        # Assert
        self.assertEqual(result, [])

    def test_generate_unknown_chord_raises_type_error(self):
        """
        Documents that generate currently cannot map an entirely unknown root.
        """
        # Arrange
        chords = [{'time': 0, 'chord': 'H'}]

        # Act & Assert
        with self.assertRaises(TypeError):
            self.generator.generate(chords)

    def test_get_chord_diagram_returns_known_major_chord(self):
        """
        Verifies that the C-major chord uses its predefined fret pattern.
        """
        # Arrange & Act
        result = self.generator._get_chord_diagram('C', self.generator.GUITAR_CHORDS)

        # Assert
        self.assertEqual(result, ['x', '3', '2', '0', '1', '0'])

    def test_get_chord_diagram_returns_known_minor_chord(self):
        """
        Verifies that Am uses its predefined minor fret pattern.
        """
        # Arrange & Act
        result = self.generator._get_chord_diagram('Am', self.generator.GUITAR_CHORDS)

        # Assert
        self.assertEqual(result, ['x', '0', '2', '2', '1', '0'])

    def test_get_chord_diagram_returns_known_sharp_chord(self):
        """
        Verifies that a sharp chord can be looked up directly.
        """
        # Arrange & Act
        result = self.generator._get_chord_diagram('F#m', self.generator.GUITAR_CHORDS)

        # Assert
        self.assertEqual(result, ['2', '4', '4', '2', '2', '2'])

    def test_get_chord_diagram_falls_back_to_natural_root(self):
        """
        Verifies that an unsupported C variation falls back to C major.
        """
        # Arrange & Act
        result = self.generator._get_chord_diagram('C7', self.generator.GUITAR_CHORDS)

        # Assert
        self.assertEqual(result, self.generator.GUITAR_CHORDS['C'])

    def test_get_chord_diagram_falls_back_to_sharp_root(self):
        """
        Verifies that an unsupported sharp variation falls back to its sharp root.
        """
        # Arrange & Act
        result = self.generator._get_chord_diagram('F#7', self.generator.GUITAR_CHORDS)

        # Assert
        self.assertEqual(result, self.generator.GUITAR_CHORDS['F#'])

    def test_get_chord_diagram_unknown_root_returns_none(self):
        """
        Verifies that a root absent from the lookup table returns None.
        """
        # Arrange & Act
        result = self.generator._get_chord_diagram('H', self.generator.GUITAR_CHORDS)

        # Assert
        self.assertIsNone(result)

    def test_format_chord_diagram_known_chord(self):
        """
        Verifies the complete six-string ASCII fret diagram.
        """
        # Arrange
        positions = self.generator.GUITAR_CHORDS['C']
        expected = (
            'C\n'
            'E  |---x---|\n'
            'A  |---3---|\n'
            'D  |---2---|\n'
            'G  |---0---|\n'
            'B  |---1---|\n'
            'e  |---0---|\n'
        )

        # Act
        result = self.generator._format_chord_diagram('C', positions)

        # Assert
        self.assertEqual(result, expected)

    def test_format_chord_diagram_unavailable_chord(self):
        """
        Verifies that an unsupported chord shows an explanatory message.
        """
        # Arrange & Act
        result = self.generator._format_chord_diagram('H', None)

        # Assert
        self.assertEqual(result, 'H\n(Chord Tab Not Available)\n')

    def test_format_progression_timeline_converts_seconds(self):
        """
        Verifies that timestamps are displayed in minutes and seconds.
        """
        # Arrange
        chords = [
            {'time': 0, 'chord': 'C'},
            {'time': 61, 'chord': 'G'},
            {'time': 125, 'chord': 'Am'},
        ]

        # Act
        result = self.generator._format_progression_timeline(chords)

        # Assert
        self.assertEqual(result, 'C - 0:00\nG - 1:01\nAm - 2:05')

    def test_format_progression_timeline_empty_list(self):
        """
        Verifies that no chord events result in an empty timeline.
        """
        # Arrange & Act
        result = self.generator._format_progression_timeline([])

        # Assert
        self.assertEqual(result, '')

    def test_generate_ascii_includes_header_diagrams_and_timeline(self):
        """
        Verifies that ASCII output contains its header, chord diagrams, and timeline.
        """
        # Arrange & Act
        result = self.generator.generate_ascii(self.chords)

        # Assert
        self.assertIn('GUITAR TABS', result)
        self.assertIn('Chords:', result)
        self.assertIn('C\nE  |---x---|', result)
        self.assertIn('Am\nE  |---x---|', result)
        self.assertIn('Chord Progression:', result)
        self.assertIn('C - 0:00\nAm - 0:02\nG - 0:04', result)

    def test_generate_ascii_shows_each_unique_chord_diagram_once(self):
        """
        Verifies that duplicate chords appear once in the chord-diagram section.
        """
        # Arrange
        chords = [
            {'time': 0, 'chord': 'C'},
            {'time': 2, 'chord': 'G'},
            {'time': 4, 'chord': 'C'},
        ]

        # Act
        result = self.generator.generate_ascii(chords)
        diagrams = result.split('Chord Progression:')[0]
        progression = result.split('Chord Progression:')[1]

        # Assert
        self.assertEqual(diagrams.count('C\nE  |---x---|'), 1)
        self.assertIn('C - 0:00', progression)
        self.assertIn('C - 0:04', progression)

    def test_generate_ascii_unknown_chord_uses_fallback_message(self):
        """
        Verifies that ASCII output reports an unavailable chord diagram.
        """
        # Arrange
        chords = [{'time': 0, 'chord': 'H'}]

        # Act
        result = self.generator.generate_ascii(chords)

        # Assert
        self.assertIn('H\n(Chord Tab Not Available)', result)
        self.assertIn('H - 0:00', result)

    def test_generate_ascii_empty_chords_has_no_progression(self):
        """
        Verifies that empty input still produces headers without chord events.
        """
        # Arrange & Act
        result = self.generator.generate_ascii([])

        # Assert
        self.assertIn('GUITAR TABS', result)
        self.assertIn('Chord Progression:', result)
        self.assertNotIn(' - 0:', result)
