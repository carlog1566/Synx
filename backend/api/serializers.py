from rest_framework import serializers
import librosa
from .models import Song

class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ['id', 'title', 'artist', 'duration', 'audio_file', 'chords', 'analyzed', 'created_at']
        read_only_fields = ['id', 'duration', 'chords', 'analyzed', 'created_at']

    def create(self, validated_data):
        song = Song.objects.create(**validated_data)

        if song.audio_file:
            try:
                duration = librosa.get_duration(path=song.audio_file.path)
                song.duration = int(duration)
                song.save()
            except Exception as e:
                print(f'Duration detection failed: {e}')
        
        return song