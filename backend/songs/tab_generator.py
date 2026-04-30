class TabGenerator:
    """
    The TabGenerator Class contains the methods used to generate tablature for specific instruments from chord progressions
    """

    GUITAR_CHORDS = {
        'C': ['x', '3', '2', '0', '1', '0'],
        'D': ['x', 'x', '0', '2', '3', '2'],
        'E': ['0', '2', '2', '1', '0', '0'],
        'F': ['1', '3', '3', '2', '1', '1'],
        'G': ['3', '2', '0', '0', '0', '3'],
        'A': ['x', '0', '2', '2', '2', '0'],
        'B': ['x', '2', '4', '4', '4', '2'],

        'Cm': ['x', '3', '5', '5', '4', '3'],
        'Dm': ['x', 'x', '0', '2', '3', '1'],
        'Em': ['0', '2', '2', '0', '0', '0'],
        'Fm': ['1', '3', '3', '1', '1', '1'],
        'Gm': ['3', '5', '5', '3', '3', '3'],
        'Am': ['x', '0', '2', '2', '1', '0'],
        'Bm': ['x', '2', '4', '4', '3', '2'],

        'C#': ['x', '4', '6', '6', '6', '4'],
        'D#': ['x', 'x', '1', '3', '4', '3'],
        'F#': ['2', '4', '4', '3', '2', '2'],
        'G#': ['4', '6', '6', '5', '4', '4'],
        'A#': ['x', '1', '3', '3', '3', '1'],

        'C#m': ['x', '4', '6', '6', '5', '4'],
        'D#m': ['x', 'x', '1', '3', '4', '2'],
        'F#m': ['2', '4', '4', '2', '2', '2'],
        'G#m': ['4', '6', '6', '4', '4', '4'],
        'A#m': ['x', '1', '3', '3', '2', '1'],
    }


    def generate(self, chords, instrument='guitar'):
        """
        Main method used to Generate tablature from chord progression

        Parameters
        ----------
        chords : list
            List of dicts with 'time' and 'chord' keys
            Example: [{'time': 0, 'chord':C}, {'time': 1, 'chord': 'G'}]
        instrument : str
            Desired instrument for tabs
        
        Returns
        -------
        str
            Formatted ASCII tablature (To be changed soon)
        """

        if instrument == 'guitar':
            chord_dict = self.GUITAR_CHORDS
        
        tabs = []

        tabs.append('=' * 50)
        tabs.append(f'{instrument.upper()} TABS')
        tabs.append('=' * 50)
        tabs.append('')

        tabs.append('Chord Progression:')
        timeline = self._format_progression_timeline(chords)
        tabs.append(timeline)
        tabs.append('')
        tabs.append('=' * 50)
        tabs.append('')

        unique_chords = []
        seen = set()
        for chord in chords:
            if chord['chord'] not in seen:
                unique_chords.append(chord['chord'])
                seen.add(chord['chord'])
        
        for chord in unique_chords:
            position = self._get_chord_diagram(chord, chord_dict)
            diagram = self._format_chord_diagram(chord, position)
            tabs.append(diagram)
            tabs.append('')

        return '\n'.join(tabs)


    def _get_chord_diagram(self, chord, chord_dict):
        """
        Get diagram for a chord with a fallback strategy

        Parameters
        ----------
        chord : str
            Chord name (e.g. 'C', 'G', 'Am')
        chord_dict : dict
            Dictionary of chord finger placements

        Returns
        -------
        list or None
            Finger positions for chord or None if chord not found
        """

        if chord in chord_dict:
            return chord_dict[chord]
        
        if len(chord) > 1 and chord[1] == '#':
            root = chord[:2]
        else:
            root = chord[0]

        if root in chord_dict:
            return chord_dict[root]
        
        return None


    def _format_chord_diagram(self, chord, positions, instrument='guitar'):
        """
        Create ASCII diagram for a single chord (to be changed soon)

        Parameters
        ----------
        chord : str
            Chord name (e.g. 'C', 'G', 'Am')
        positions : list
            Finger/fret positions for the chord
        instrument : str
            Desired instrument for tabs

        Returns
        -------
        str
            ASCII art chord diagram (to be changed soon)
        """

        if not positions:
            return f'{chord}\n(Chord Tab Not Available)\n'
        
        tab = [chord]

        if instrument == 'guitar':
            string_names = ['E', 'A', 'D', 'G', 'B', 'e']

        for i, string_name in enumerate(string_names):
            pos = positions[i]
            line = f'{string_name}  |---{pos}---|'
            tab.append(line)

        return '\n'.join(tab) + '\n'


    def _format_progression_timeline(self, chords):
        """
        Format the chord progression with timestamps

        Parameters
        ----------
        chords : list
            List of dicts with 'time' and 'chord' keys
            Example: [{'time': 0, 'chord':C}, {'time': 1, 'chord': 'G'}]
        
        Returns
        -------
        str
            Formatted timeline (e.g. "C - 0:00      A - 0:01        G - 0:02)
        """

        timeline = []

        for chord in chords:
            time_sec = chord['time']
            chord_name = chord['chord']

            minutes = int(time_sec // 60)
            seconds = int(time_sec % 60)
            time = f'{minutes}:{seconds:02d}'

            part = f'{chord_name} - {time}'
            timeline.append(part)

        return '    '.join(timeline)

