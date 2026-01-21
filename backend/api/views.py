from django.shortcuts import render
from rest_framework import viewsets
from .models import Song
from .serializers import SongSerializer


# Create your views here.

class SongViewset(viewsets.ModelViewSet):
    queryset = Song.objects.all()
    serializer_class = SongSerializer