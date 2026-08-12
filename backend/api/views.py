import tempfile
import os
from django.shortcuts import render
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Song
from .serializers import SongSerializer
from songs.chord_detector import ChordDetector
from songs.tab_generator import TabGenerator

# Create your views here.

class SongViewset(viewsets.ModelViewSet):
    queryset = Song.objects.all()
    serializer_class = SongSerializer

    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        song = self.get_object()

        if not song.audio_file:
            return Response({'error': 'No audio file'},
                        status=status.HTTP_400_BAD_REQUEST)

        try:
            if settings.USE_S3:
                # Download to a temp file since librosa needs a local path
                with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
                    for chunk in song.audio_file.chunks():
                        tmp.write(chunk)
                    tmp_path = tmp.name

                try:
                    detector = ChordDetector()
                    chords = detector.analyze(tmp_path, step=2.0)
                finally:
                    os.unlink(tmp_path)  # Always clean up temp file
            else:
                detector = ChordDetector()
                chords = detector.analyze(song.audio_file.path, step=2.0)

            tab_gen = TabGenerator()
            tabs = {
                'guitar': tab_gen.generate(chords, 'guitar'),
            }

            song.chords = chords
            song.tabs = tabs
            song.analyzed = True
            song.save()

            return Response(self.get_serializer(song).data)

        except Exception as e:
            return Response({'error': str(e)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # Defined to prepare for future auth
    def get_queryset(self):
        # return Song.objects.filter(owner=self.request.user) | Song.objects.filter(is_public=True)   # Uncomment when auth is implemented
        return Song.objects.all()


    # Defined to prepare for future auth
    def perform_create(self, serializer):
        # serializer.save(owner=self.request.user)    # Uncomment when auth is implemented
        serializer.save()