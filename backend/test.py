from songs.tab_generator import TabGenerator

gen = TabGenerator()

test_chords = [
    {'time': 0.0, 'chord': 'C'},
    {'time': 2.0, 'chord': 'Am'},
    {'time': 4.0, 'chord': 'F'},
]

result = gen.generate(test_chords, 'guitar')

# Print each item
for item in result:
    print(f"\nTime: {item['time']}")
    print(f"Chord: {item['chord']}")
    print(f"Positions: {item['positions']}")