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
            500 if chord detection or tab generation raises any exception.
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
            The validated serializer instance used to create the Song.
        """

        serializer.save(owner=self.request.user)


class RegisterView(APIView):
    """
    Handles new user registration with traditional username & password credentials.

    Validates that username and password are provided, enforces Django's password strength 
    requirements, and ensures both username and email are unique before creating the account.
    On success, immediately issues JWT auth cookes so the user is logged in without a 
    separate login step.

    Permissions
    -----------
    AllowAny - registration must be accessible to unauthenticated users.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Creates a new user account and assigns cookies on account creation.

        Parameters
        ----------
        request.data : dict
            Expected keys: 
              'username' (str) - the user's desired username
              'password' (str) - the user's desired password
              'email' (str) - the user's chosen email

        Returns
        -------
        Response
            201 with {'message': ..., 'username': ...} and auth cookies set on success.
            400 with {'error': ...} if validation fails at any stage (missing fields, weak
            password, duplicate username/email)).
        """

        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')

        if not username or not password or not email:
            return Response(
                {'error': 'Username, password, and email are required'},
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
    """
    Authenticates a user via username/password and issues JWT tokens as httpOnly cookies, rather
    than returning them in the JSON response body (simplejwt's default behavior).

    Overriding post() this way keeps tokens inaccessible to client-side JavaScript, protecting 
    against theft via XSS, while still reusing simplejwt's built-in credential validation logic
    via TokenObtainPairSerializer.
    """

    def post(self, request, *args, **kwargs):
        """
        Validate username/password and log the user in.

        Parameters
        ----------
        request.data : dict
            Expected keys: 
              'username' (str) - the inputted username
              'password' (str) - the inputted password

        Returns
        -------
        Response
            200 with {'message': 'Login Successful'} and access_token/refresh_token set as httpOnly
            cookies, on valid credentials.
            401 if credentials are invalid (raised automatically by is_valid(raise_exception=True) 
            via the serializer).
        """

        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        access_token = serializer.validated_data['access']
        refresh_token = serializer.validated_data['refresh']

        response = Response({'message': 'Login Successful'})

        set_auth_cookies(response, access_token, refresh_token)

        return response


class GoogleLoginView(APIView):
    """
    Authenticates and registers a user via Google Sign-in, then issues the same httpOnly JWT cookies
    used by traditional login.

    Verifies the Google ID token server-side (never trusting the frontend's claim about who the user
    is), then either finds an existing account by email or creates a new one. New accounts receive a 
    generated username derived from their email's local part and an unusable password, since Google
    verification is the sole proof of identity for these users.

    Permissions
    -----------
    AllowAny - registration must be accessible to unauthenticated users.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Verify a Google ID token and log the associated user in.

        Parameters
        ----------
        request.data : dict
            Expected key: 
              'credential' (str) - the Google ID token obtained by the frontend's Google Sign-In button.

        Returns
        -------
        Response
            200 with {'message' : 'Login successful'} and access_token/refresh_token set as httpOnly
            cookies, if the token is valid and the associated Google email is verified.
            400 with {'error': ...} if no credential was provided in request.data
            400 with {'error': ...} if the Google token fails verification (invalid, expired, or 
            tampered with).
            400 with {'error': ...} if the Google account's email is not verified.
        """

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
    """
    Clears the JWT auth cookies, logging the current user out.

    Permissions
    -----------
    AllowAny - log out can be performed by an authenticated user or an already logged out user with no 
               risks
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Log the current user out by clearning their auth cookies.

        Returns
        -------
        Response
            200 with {'message': 'Logged out successfully'} always, with access_token and refresh_token
            cookies cleared.
        """

        response = Response({'message': 'Logged out successfully'})

        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')

        return response


class MeView(APIView):
    """
    Obtain the current user's information. Used as the frontend's way to check whether a user is logged
    in.

    Permissions
    -----------
    IsAuthenticated - can only be performed by a logged in user
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Obtain the current user's username, email, date_joined, and has_password

        Returns
        -------
            200 with {'username': username, 'email': email, 'date_joined': date_joined, 'has_password':
            has_usable_password()} always
        """

        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'date_joined': request.user.date_joined,
            'has_password': request.user.has_usable_password(),
        })


class ForgotPasswordView(APIView):
    """
    Sends a password reset email if the given email matches an already existing account.

    Permissions
    -----------
    AllowAny - any user is able request this email to be sent
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Sends a password reset email if the given email matdches an existing account. Deliberately
        returns the same response either way, whether or not the email exists.

        Parameters
        ----------
        request.data : dict
            Expected key: 
              'email' (str) - the email taht the user believes is associated with their account.

        Returns
        -------
            200 with {'message': 'If that email exists, a reset link has been sent.'} regardless if
            the email exists or the reset link was actually sent.
            500 with {'error': 'Failed to send reset email'} if sending the email via Resend fails
            for any reason.
        """

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
    """
    Completes the password reset flow started by ForgotPasswordView. 
    
    Validates that the uid decodes to a real, existing user, and that the token is genuine, unexpired,
    and unused for that specific user.

    Permissions
    -----------
    AllowAny - the reset link itself, not the login session, is what proves the requester's identity.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Verify the reset link and set a new password if valid.

        Parameters
        ----------
        request.data : dict
            Expected keys:
              'uid' (str) - base64-encoded user id from the reset link
              'token' (str) - the reset token from the reset link
              'new_password' (str) - the password to set

        Returns
        -------
        Response
            200 with {'message': 'Password reset successfully'} if uid, token, and new_password are
            all valid.
            400 with {'error': 'Invalid reset link'} if uid can't be decoded or doesn't correspond
            to an existing user.
            400 with {'error': 'Invalid token'} if the token doesn't match a valid, unexpired reset
            credential for that user.
            400 with {'error': [...]} if new_password fails Django's password strength validation.
        """

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
    """
    Changes the authenticated user's password.

    Requires the current password for users with an existing password, validates and confirms the new
    password, and supports creating a password for users who do not currently have one (users who
    logged in via Google).

    Permissions
    -----------
    IsAuthenticated - only authenticated users can access this view and provides another way for a
    user to change their password without going through the forgot password flow
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Updates the authenticated user's password. Verfies the current password if one exists, checks
        that the new password and confirmation match, validates the new password, and saves the 
        updated password.
        
        Parameters
        ----------
        request.data : dict
            Expected keys:
              'current_password' (str) - the user's current password.
              'new_password' (str) - the password the user wants to change their password to.
              'confirm_password' (str) - verifies that the new password is correct.

        Returns
        -------
            200 with {'message': 'Password changed successfully'} if the user had an existing password
            and changed it.
            200 with {'message': 'Password created successfully'} if the user did not have a password
            previously.
            400 with {'error': 'Current password is required'} if the user did not provide their 
            current password.
            400 with {'error': 'Current password is incorrect'} if the user did not provide the 
            correct password.
            400 with {'error': 'Passwords do not match'} if the user's new password doesn't match the
            confirm password.
        """

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