from rest_framework import serializers
from .models import Song

class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ['id', 'title', 'artist', 'duration', 'audio_file', 'chords', 'analyzed', 'created_at']
        read_only_fields = ['id', 'chords', 'analyzed', 'created_at']