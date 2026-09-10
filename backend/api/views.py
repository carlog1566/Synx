import tempfile
import os
import resend
from decouple import config
from django.shortcuts import render
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from songs.chord_detector import ChordDetector
from songs.tab_generator import TabGenerator
from .models import Song
from .serializers import SongSerializer
from .utils import set_auth_cookies

# Create your views here.
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID')
resend.api_key = config('RESEND_API_KEY')


class SongViewset(viewsets.ModelViewSet):
    """
    Provides CRUD operations for Song objects. It is bounded by the authenticated
    user's own songs and any songs that get marked as public.

    Standard ModelViewSet actions (list, create, retrieve, update, destroy) are all
    included automatically via Django REST Framework's routing. Two custom actions
    extend this: analyze (chord detection) and toggle_public (sharing control).

    Permissions
    -----------
    IsAuthenticated - all actions require a user who is logged-in.

    Queryset Scoping
    ----------------
    Users can only see/modify their own songs, except for reading songs other users
    have marked is_public = True (see get_queryset).
    """

    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        """
        Run chord detection and tab generation on this song's audio file, then persist
        results to the Song record

        The song must already have an audio_file uploaded;, this endpoint does not 
        accept a new file, it processes whatever is already stored.

        When USE_S3 is enabled, the audio file is downloaded to a temporary local file
        first, since librosa's analysis requires a filesystem path rather than a remote
        URL. The temp file is always cleaned up afterwards, whether analysis succeeds or
        raises an exception.

        Parameters
        ----------
        pk : int
            The primary key (ID) of the Song to analyze, taken from the URL.

        Returns
        -------
        Response
            200 with the full serialized Song (including populated chords, tabs, and 
            analyzed = True) on success.
            400 if the song has no audio_file.
            500 if chord detection or tab generation raises any exception
        """

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
        """
        Toggles whether a song is public or not public. When public = True, the song is 
        visible to all users including you. When public = False, the song is only visible 
        to you.
        
        Parameters
        ----------
        pk : int
            The primary key (ID) of the Song to analyze, taken from the URL.

        Returns
        -------
        Response
            200 with the serialized Song and the Song's is_public being True or False 
            depending on its previous/original value.
        """

        song = self.get_object()
        song.is_public = not song.is_public
        song.save()
        return Response(self.get_serializer(song).data)


    def get_queryset(self):
        """
        Collects the songs created by the user as well as public songs.

        Returns
        -------
        django.db.models.query.QuerySet
            A combined, deduplciated QuerySet that contains all Song records where the
            owner is the current user or the song is marked as public.
        """

        return Song.objects.filter(owner=self.request.user) | Song.objects.filter(is_public=True)


    def perform_create(self, serializer):
        """
        Saves a new Song and assigns the authenticated user as its owner.

        Parameters
        ----------
        serializer : SongSerializer
            The validated serializer instance used to create the Song
        """

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

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'An account with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.create_user(username=username, password=password, email=email)
        except IntegrityError:
            return Response(
                {'error': 'An account with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        refresh_token = RefreshToken.for_user(user)
        access_token = refresh_token.access_token

        response = Response(
            {'message': 'User created successfully', 'username': user.username},
            status = status.HTTP_201_CREATED
        )

        set_auth_cookies(response, access_token, refresh_token)

        return response


class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        access_token = serializer.validated_data['access']
        refresh_token = serializer.validated_data['refresh']

        response = Response({'message': 'Login Successful'})

        set_auth_cookies(response, access_token, refresh_token)

        return response


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        google_token = request.data.get('credential')

        if not google_token:
            return Response(
                {'error': 'No crednetial provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            idinfo = id_token.verify_oauth2_token(google_token, google_requests.Request(), GOOGLE_CLIENT_ID)
        except ValueError:
            return Response(
                {'error': 'Invalid Google toekn'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        email = idinfo.get('email')
        email_verified = idinfo.get('email_verified')

        if not email_verified:
            return Response(
                {'error': 'Google email not verified'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(email__iexact=email).first()

        if not user:
            base_username = email.split('@')[0]
            username = base_username
            counter = 1

            while User.objects.filter(username=username).exists():
                username = f'{base_username}{counter}'
                counter += 1

            user = User(
                username=username,
                email=email
            )

            user.set_unusable_password()
            user.save()

        elif user.username == user.email and (user.password == '' or not user.has_usable_password()):
            base_username = email.split('@')[0]
            username = base_username
            counter = 1

            while (
                User.objects.filter(username=username)
                .exclude(pk=user.pk)
                .exists()
            ):
                username = f'{base_username}{counter}'
                counter += 1

            user.username = username
            user.set_unusable_password()
            user.save()

        refresh_token = RefreshToken.for_user(user)
        access_token = refresh_token.access_token

        response = Response({'message': 'Login successful'})

        set_auth_cookies(response, access_token, refresh_token)

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
            'email': request.user.email,
            'date_joined': request.user.date_joined,
            'has_password': request.user.has_usable_password(),
        })


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        try:
            user = User.objects.get(email__iexact=email)

            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

            resend.Emails.send({
                "from": "Synx <noreply@synx.studio>",
                "to": [user.email],
                "subject": "Reset your Synx password",
                "html": f"""
                    <h2>Reset your Synx password</h2>
                    <p>We received a request to reset your password.</p>
                    <p>
                        <a href="{reset_link}">
                            Reset Password
                        </a>
                    </p>
                    <p>If you didn't request this, you can ignore this email.</p>
                """
            })

        except User.DoesNotExist:
            pass

        except Exception as e:
            print("RESEND ERROR:", repr(e))

            return Response(
                {'error': 'Failed to send reset email'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({'message': 'If that email exists, a reset link has been sent.'})


class ResetPasswordConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {'error': 'Invalid reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Invalid token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password)
        except ValidationError as e:
            return Response(
                {'error': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password reset successfully'})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        had_password = user.has_usable_password()

        if had_password:
            if not current_password:
                return Response(
                    {'error': 'Current password is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not user.check_password(current_password):
                return Response(
                    {'error': 'Current password is incorrect'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if new_password != confirm_password:
            return Response(
                {'error': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user=user)
        except ValidationError as e:
            return Response(
                {'error': list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        if had_password:
            message = 'Password changed successfully'
        else:
            message = 'Password created successfully'

        return Response({
            'message': message
        })


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.has_usable_password():
            password = request.data.get('password')

            if not password:
                return Response(
                    {'error': 'Password is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not user.check_password(password):
                return Response(
                    {'error': 'Incorrect password'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        else:
            confirmation = request.data.get('confirmation')

            if confirmation != 'DELETE':
                return Response(
                    {'error': 'Type DELETE to confirm account deletion'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        user.delete()

        response = Response({
            'message': 'Account deleted successfully'
        })

        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')

        return response



class SongStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_songs = Song.objects.filter(owner=self.request.user).count()
        analyzed_songs = Song.objects.filter(owner=self.request.user, analyzed=True).count()

        return Response({
            'total_songs': total_songs,
            'analyzed_songs': analyzed_songs,
        })