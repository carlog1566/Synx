import tempfile
import os
from decouple import config
from django.shortcuts import render
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Song
from .serializers import SongSerializer
from songs.chord_detector import ChordDetector
from songs.tab_generator import TabGenerator
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

# Create your views here.

class SongViewset(viewsets.ModelViewSet):
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

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


    @action(detail=True, methods=['patch'])
    def toggle_public(self, request, pk=None):
        song = self.get_object()
        song.is_public = not song.is_public
        song.save()
        return Response(self.get_serializer(song).data)


    def get_queryset(self):
        return Song.objects.filter(owner=self.request.user) | Song.objects.filter(is_public=True)


    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(password)
        except ValidationError as e:
            return Response(
                {'error':list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already taken'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(username=username, password=password, email = email)

        return Response(
            {'message': 'User created successfully', 'username': user.username},
            status = status.HTTP_201_CREATED
        )


class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        access_token = serializer.validated_data['access']
        refresh_token = serializer.validated_data['refresh']

        response = Response({'message': 'Login Successful'})

        response.set_cookie(
            key='access_token',
            value=str(access_token),
            httponly=True,
            secure=not config('DEBUG', default=True, cast=bool),
            samesite='Lax',
            max_age=3600
        )

        response.set_cookie(
            key='refresh_token',
            value=str(refresh_token),
            httponly=True,
            secure=not config('DEBUG', default=True, cast=bool),
            samesite='Lax',
            max_age=604800
        )

        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({'message': 'Logged out successfully'})

        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')

        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'username': request.user.username,
            'email': request.user.email
        })