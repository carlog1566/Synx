from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Song
from .serializers import SongSerializer
from songs.chord_detector import ChordDetector

# Create your views here.

class SongViewset(viewsets.ModelViewSet):
    queryset = Song.objects.all()
    serializer_class = SongSerializer

    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        song = self.get_object()

        if not song.audio_file:
            return Response({'error': 'ERROR: Audio File not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            detector = ChordDetector()
            file_path = song.audio_file.path
            chords = detector.analyze(file_path)

        except Exception as e:
            return Response({'error': 'ERROR: Failed to process audio file'}, status=status.HTTP_400_BAD_REQUEST)
        
        song.chords = chords
        song.analyzed = True
        song.save()

        serializer = self.get_serializer(song)

        return Response(serializer.data, status=status.HTTP_200_OK)