from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

@patch('api.views.RegisterView.throttle_classes', [])
class RegisterViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method in this class. Creates one existing user that the duplicate-
        username/email tests can reuse, so each of those tests doesn't need to repeat the same setup
        code.
        """
        self.existing_username = 'existinguser'
        self.existing_password = 'myPassword123!'
        self.existing_email = 'existinguser@email.com'

        self.new_username = 'newuser'
        self.new_password = 'newPassword123!'
        self.new_email = 'newuser@email.com'

        self.existing_user = User.objects.create_user(
            username=self.existing_username,
            password=self.existing_password,
            email=self.existing_email
        )

    def test_register_success_creates_user(self):
        """
        Verifies that a successful registration saves a new User row to the database.
        """
        # Arrange & Act
        self.client.post('/api/auth/register/', {
            'username': self.new_username,
            'password': self.new_password,
            'email': self.new_email,
        })

        # Assert
        self.assertTrue(User.objects.filter(username=self.new_username).exists())

    def test_register_success_returns_201(self):
        """
        Verifies that a successful registration responds with 201 created.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/register/', {
            'username': self.new_username,
            'password': self.new_password,
            'email': self.new_email,
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'User created successfully')
        self.assertEqual(response.data['username'], self.new_username)

    def test_register_missing_username_returns_400(self):
        """
        Verifies that registration without a username responds with 400 bad request.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/register/', {
            'username': '',
            'password': self.new_password,
            'email': self.new_email,
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Username, password, and email are required')

    def test_register_missing_password_returns_400(self):
        """
        Verifies that registration without a password responds with 400 bad request.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/register/', {
            'username': self.new_username,
            'password': '',
            'email': self.new_email,
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Username, password, and email are required')

    def test_register_missing_email_returns_400(self):
        """
        Verifies that registration without an email responds with 400 bad request.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/register/', {
            'username': self.new_username,
            'password': self.new_password,
            'email': '',
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Username, password, and email are required')

    def test_register_duplicate_username_returns_400(self):
        """
        Verifies that registration with an username that already exists responds with 400 bad request.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/register/', {
            'username': self.existing_username,
            'password': self.new_password,
            'email': self.new_email,
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Username already taken')

    def test_register_duplicate_email_returns_400(self):
        """
        Verifies that registration with an email that already exists responds with 400 bad request.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/register/', {
            'username': self.new_username,
            'password': self.new_password,
            'email': self.existing_email,
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'An account with this email already exists')

    def test_register_weak_password_returns_400(self):
        """
        Verifies that registration with a password that doesn't meet Django's password validation
        requirements returns a 400 bad request.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/register/', {
            'username': self.new_username,
            'password': 'weak',
            'email': self.new_email,
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_success_sets_auth_cookie(self):
        """
        Verifies that successful registration logs the user in immediately by setting the access_token
        cookie.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/register/', {
            'username': self.new_username,
            'password': self.new_password,
            'email': self.new_email,
        })

        # Assert
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertEqual(response.data['message'], 'User created successfully')
        self.assertEqual(response.data['username'], self.new_username)


class RegisterThrottleTest(TestCase):
    def test_register_throttled_after_limit(self):
        """
        Verifies that the 5th registration attempt from the same client within an hour should be
        rejected with 429. 
        """
        # Arrange
        for i in range(4):
            response = self.client.post('/api/auth/register/', {
                'username': f'throttletest{i}',
                'password': '',
                'email': f'throttletest{i}@email.com'
            })

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Act
        response = self.client.post('/api/auth/register/', {
            'username': 'throttletest5',
            'password': 'MyPassword123!',
            'email': 'throttletest5@email.com'
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class CookieTokenObtainPairViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method in this class. Creates one existing user that login tests can 
        reuse, so each of those tests doesn't need to repeat the same setup code.
        """
        self.username = 'existingUser'
        self.password = 'myPassword123!'
        self.email = 'existinguser@email.com'

        self.existing_user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email=self.email
        )

    def test_login_success_sets_access_token_cookie(self):
        """
        Verifies that a successful login logs the user immediately by setting both cookies, access_token
        and refresh_token, and returns 200 OK.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password,
        })

        # Arrange
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertEqual(response.data['message'], 'Login Successful')


class LogoutViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method in this class. Creates one existing user that the logout tests can
        reuse, so each of the tests don't need to repeat the same code.
        """
        self.username = 'existingUser'
        self.password = 'myPassword123!'
        self.email = 'existinguser@email.com'

        self.existing_user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email=self.email
        )

    def test_authenticated_logout_deletes_auth_cookie(self):
        """
        Verifies that a successful logout by an authenticated user immediately deletes both auth cookies,
        access_token and refresh_token, and returns 200 OK.
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password,
        })

        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)

        # Act
        response = self.client.post('/api/auth/logout/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.cookies['access_token']['max-age'], 0)
        self.assertEqual(response.cookies['refresh_token']['max-age'], 0)
        self.assertEqual(response.data['message'], 'Logged out successfully')

    def test_unauthenticated_logout_returns_200(self):
        """
        Verifies that a logout done by an unauthenticated user will still return a 200 OK.
        """
        # Arrange
        response = self.client.post('/api/auth/logout/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Logged out successfully')


class GoogleLoginViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method. Creates an existing user to test Google login
        when an account with the same email already exists.
        """
        self.existing_user = User.objects.create_user(
            username='existinguser',
            password='myPassword123!',
            email='existinguser@email.com'
        )

        self.google_email = 'googleuser@gmail.com'
        self.google_username = 'googleuser'
        self.credential = 'mock-google-id-token'

    @patch('api.views.id_token.verify_oauth2_token')
    def test_google_login_with_new_user_creates_account(self, mock_verify):
        """
        Verifies that successful Google login creates a new user with an unusable password.
        """
        # Arrange
        mock_verify.return_value = {
            'email': self.google_email,
            'email_verified': True
        }

        # Act
        response = self.client.post('/api/auth/google/', {
            'credential': self.credential
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(User.objects.filter(email=self.google_email).exists())

        google_user = User.objects.get(email=self.google_email)
        self.assertEqual(google_user.username, self.google_username)
        self.assertFalse(google_user.has_usable_password())

    @patch('api.views.id_token.verify_oauth2_token')
    def test_google_login_with_existing_user_does_not_create_duplicate(self, mock_verify):
        """
        Verifies that Google login reuses an existing account with the same email.
        """
        # Arrange
        mock_verify.return_value = {
            'email': self.existing_user.email,
            'email_verified': True
        }

        # Act
        response = self.client.post('/api/auth/google/', {
            'credential': self.credential
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            User.objects.filter(email=self.existing_user.email).count(),
            1
        )

    @patch('api.views.id_token.verify_oauth2_token')
    def test_google_login_success_returns_message(self, mock_verify):
        """
        Verifies that successful Google login returns the expected success message.
        """
        # Arrange
        mock_verify.return_value = {
            'email': self.google_email,
            'email_verified': True
        }

        # Act
        response = self.client.post('/api/auth/google/', {
            'credential': self.credential
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Login successful')

    @patch('api.views.id_token.verify_oauth2_token')
    def test_google_login_success_sets_access_token_cookie(self, mock_verify):
        """
        Verifies that successful Google login sets the access token cookie.
        """
        # Arrange
        mock_verify.return_value = {
            'email': self.google_email,
            'email_verified': True
        }

        # Act
        response = self.client.post('/api/auth/google/', {
            'credential': self.credential
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)
        self.assertTrue(response.cookies['access_token'].value)

    @patch('api.views.id_token.verify_oauth2_token')
    def test_google_login_success_sets_refresh_token_cookie(self, mock_verify):
        """
        Verifies that successful Google login sets the refresh token cookie.
        """
        # Arrange
        mock_verify.return_value = {
            'email': self.google_email,
            'email_verified': True
        }

        # Act
        response = self.client.post('/api/auth/google/', {
            'credential': self.credential
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('refresh_token', response.cookies)
        self.assertTrue(response.cookies['refresh_token'].value)

    def test_google_login_without_credential_returns_400(self):
        """
        Verifies that Google login returns a 400 response when no credential is provided.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/google/', {})

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'No crednetial provided')

    @patch('api.views.id_token.verify_oauth2_token')
    def test_google_login_with_invalid_token_returns_400(self, mock_verify):
        """
        Verifies that Google login returns a 400 response when the ID token is invalid.
        """
        # Arrange
        mock_verify.side_effect = ValueError

        # Act
        response = self.client.post('/api/auth/google/', {
            'credential': self.credential
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Invalid Google toekn')

    @patch('api.views.id_token.verify_oauth2_token')
    def test_google_login_with_unverified_email_returns_400(self, mock_verify):
        """
        Verifies that Google login rejects an account whose email is not verified.
        """
        # Arrange
        mock_verify.return_value = {
            'email': self.google_email,
            'email_verified': False
        }

        # Act
        response = self.client.post('/api/auth/google/', {
            'credential': self.credential
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Google email not verified')


class MeViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method in this class. Creates one existing user that the MeView tests can
        reuse, so each of the tests don't need to repeat the same code.
        """
        self.username = 'existingUser'
        self.password = 'myPassword123!'
        self.email = 'existinguser@email.com'

        self.existing_user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email=self.email
        )

    def test_me_authenticated_returns_user_info(self):
        """
        Verifies that an authenticated user can retrieve their username, email, date joined, and whether
        they have a usable password.
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Act
        response = self.client.get('/api/auth/me/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.username)
        self.assertEqual(response.data['email'], self.email)
        self.assertEqual(response.data['date_joined'], self.existing_user.date_joined)
        self.assertTrue(response.data['has_password'])

    def test_me_unauthenticated_returns_401(self):
        """
        Verifies that an unauthenticated user cannot access the current user's information.
        """
        # Arrange & Act
        response = self.client.get('/api/auth/me/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ForgotPasswordViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method in this class. Creates an existing user whose email 
        can be reused in password-reset tests.
        """
        self.username = 'existinguser'
        self.password = 'myPassword123!'
        self.email = 'existinguser@email.com'

        self.existing_user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email=self.email
        )

    @patch('api.views.resend.Emails.send')
    def test_forgot_password_existing_email_returns_200(self, mock_send):
        """
        Verifies that requesting a password reset for an existing email returns 200 OK and 
        sends a reset email.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/forgot-password/', {
            'email': self.email
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'If that email exists, a reset link has been sent.')
        mock_send.assert_called_once()

    @patch('api.views.resend.Emails.send')
    def test_forgot_password_email_lookup_is_case_insensitive(self, mock_send):
        """
        Verifies that an existing email is found even when its capitalization
        differs from the email stored in the database.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/forgot-password/', {
            'email': self.email.upper()
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'If that email exists, a reset link has been sent.')
        mock_send.assert_called_once()

    @patch('api.views.resend.Emails.send')
    def test_forgot_password_nonexistent_email_returns_generic_message(self, mock_send):
        """
        Verifies that requesting a password reset for an unknown email
        returns the same generic message without sending an email.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/forgot-password/', {
            'email': 'unknown@email.com'
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'If that email exists, a reset link has been sent.')
        mock_send.assert_not_called()

    @patch('api.views.resend.Emails.send')
    def test_forgot_password_email_failure_returns_500(self, mock_send):
        """
        Verifies that a failure when sending the reset email returns 500
        Internal Server Error.
        """
        # Arrange
        mock_send.side_effect = Exception('Email sending failed')

        # Act
        response = self.client.post('/api/auth/forgot-password/', {
            'email': self.email
        })

        # Assert
        self.assertEqual(
            response.status_code,
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        self.assertEqual(response.data['error'], 'Failed to send reset email')
        mock_send.assert_called_once()


class ResetPasswordConfirmViewTest(TestCase):
    def setUp(self):
        pass


class ChangePasswordViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method in this class. Creates one existing user and one google user 
        that the change password tests can reuse, so each of the tests don't need to repeat the same code.
        """
        self.username = 'existinguser'
        self.password = 'myPassword123!'
        self.email = 'existinguser@email.com'

        self.google_username = 'googleuser'
        self.google_email = 'googleuser@gmail.com'

        self.new_password = 'myNewPassword123!'

        self.existing_user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email=self.email
        )

        self.google_user = User.objects.create_user(
            username=self.google_username,
            email=self.google_email
        )
        self.google_user.set_unusable_password()
        self.google_user.save()

    def test_successful_change_password_with_usable_password_changes_password(self):
        """
        Verifies that when an authenticated user with a usable password changes their password, the 
        password is actually changed
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Act
        response = self.client.post('/api/auth/change-password/', {
            'current_password': self.password,
            'new_password': self.new_password,
            'confirm_password': self.new_password
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.existing_user.refresh_from_db()
        self.assertTrue(self.existing_user.check_password(self.new_password))
        self.assertEqual(response.data['message'], 'Password changed successfully')

    def test_change_password_with_incorrect_current_password_returns_400(self):
        """
        Verifies that when an authenticated user with a usable password tries to change their 
        password with the incorrect current password, it will return 400 bad request.
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Act
        response = self.client.post('/api/auth/change-password/', {
            'current_password': 'wrong_password',
            'new_password': self.new_password,
            'confirm_password': self.new_password
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Current password is incorrect')

    def test_change_password_without_current_password_returns_400(self):
        """
        Verifies that when an authenticated user with a usable password tries to change their 
        password without a current_password, it will return 400 bad request.
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Act
        response = self.client.post('/api/auth/change-password/', {
            'current_password': '',
            'new_password': self.new_password,
            'confirm_password': self.new_password
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Current password is required')

    def test_change_password_with_mismatched_passwords_returns_400(self):
        """
        Verifies that when an authenticated user with a usable password tries to change their 
        password, if the new and confirm passwords don't match, it will return 400 bad request.
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Act
        response = self.client.post('/api/auth/change-password/', {
            'current_password': self.password,
            'new_password': self.new_password,
            'confirm_password': 'unmatchedPassword'
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Passwords do not match')

    def test_change_password_with_weak_new_password_returns_400(self):
        """
        Verifies that when an authenticated user with a usable password tries to change their 
        password, if the new password doesn't meet Django's password validation requirements 
        it returns a 400 bad request.
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Act
        response = self.client.post('/api/auth/change-password/', {
            'current_password': self.password,
            'new_password': 'new',
            'confirm_password': 'new'
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_with_unauthenticated_user_returns_401(self):
        """
        Verifies that if an unauthenticated user attempts to change password, it will return
        401 unauthorized
        """
        # Act
        response = self.client.post('/api/auth/change-password/', {
            'current_password': self.password,
            'new_password': self.new_password,
            'confirm_password': self.new_password
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_for_user_with_unusable_password_succeeds(self):
        """
        Verifies that users with an unusable password (google users) are able to create a 
        working password via change password
        """
        # Arrange
        refresh = RefreshToken.for_user(self.google_user)
        access_token = refresh.access_token
        self.client.cookies['access_token'] = str(access_token)

        # Act
        response = self.client.post('/api/auth/change-password/', {
            'new_password': self.new_password,
            'confirm_password': self.new_password
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.google_user.refresh_from_db()
        self.assertTrue(self.google_user.has_usable_password())
        self.assertTrue(self.google_user.check_password(self.new_password))
        self.assertEqual(response.data['message'], 'Password created successfully')

    def test_change_password_old_password_no_longer_works(self):
        """
        Verifies that when users change their password, their old password no longer works.
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post('/api/auth/change-password/', {
            'current_password': self.password,
            'new_password': self.new_password,
            'confirm_password': self.new_password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.existing_user.refresh_from_db()
        self.assertTrue(self.existing_user.check_password(self.new_password))


        # Act
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_new_password_can_be_used_to_login(self):
        """
        Verifies that when users change their password, their new password works and can be used to login.
        """
        # Arrange
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post('/api/auth/change-password/', {
            'current_password': self.password,
            'new_password': self.new_password,
            'confirm_password': self.new_password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.existing_user.refresh_from_db()
        self.assertTrue(self.existing_user.check_password(self.new_password))


        # Act
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.new_password
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class DeleteAccountViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method in this class. Creates one existing user and one google user 
        that the change password tests can reuse, so each of the tests don't need to repeat the same code.
        """
        self.username = 'existinguser'
        self.password = 'myPassword123!'
        self.email = 'existinguser@email.com'

        self.google_username = 'googleuser'
        self.google_email = 'existinguser@gmail.com' 

        self.existing_user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email=self.email
        )

        self.google_user = User.objects.create_user(
            username=self.google_username,
            email=self.google_email
        )
        self.google_user.set_unusable_password()
        self.google_user.save()

    def test_delete_existing_account_with_usable_password_success_deletes_account(self):
        """
        Verifies than an authenticated user with a usable password can delete their account.
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Act
        response = self.client.post('/api/auth/delete-account/', {
            'password': self.password,
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(username=self.username).exists())
        self.assertEqual(response.data['message'], 'Account deleted successfully')

    def test_delete_existing_account_with_usable_password_success_clears_auth_cookies(self):
        """
        Verifies that when an authenticated user with a usable password successfully deletes their account,
        their auth cookies, refresh & access, are cleared.
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Act
        response = self.client.post('/api/auth/delete-account/', {
            'password': self.password
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.cookies['access_token']['max-age'], 0)
        self.assertEqual(response.cookies['refresh_token']['max-age'], 0)

    def test_delete_existing_account_without_password_returns_400(self):
        """
        Verifies that a user with a usable password cannot delete their account without providing it.
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Act
        response = self.client.post('/api/auth/delete-account/', {})

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Password is required')
        self.assertTrue(User.objects.filter(username='existinguser').exists())

    def test_delete_existing_account_with_incorrect_password_returns_400(self):
        """
        Verifies that a user with a usable password cannot delete their account using an incorrect password.
        """
        # Arrange
        response = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Act
        response = self.client.post('/api/auth/delete-account/', {
            'password': 'WrongPassword123!'
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Incorrect password')
        self.assertTrue(User.objects.filter(username='existinguser').exists())

    def test_delete_account_without_usable_password_with_correct_confirmation_deletes_account(self):
        """
        Verifies that a user without a usable password can delete their account with the correct confirmation.
        """
        # Arrange
        refresh = RefreshToken.for_user(self.google_user)
        self.client.cookies['access_token'] = str(refresh.access_token)

        # Act
        response = self.client.post('/api/auth/delete-account/', {
            'confirmation': 'DELETE'
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(username='googleuser').exists())
        self.assertEqual(response.data['message'], 'Account deleted successfully')

    def test_delete_account_without_usable_password_without_confirmation_returns_400(self):
        """
        Verifies that a user without a usable password cannot delete their account without confirmation.
        """
        # Arrange
        refresh = RefreshToken.for_user(self.google_user)
        self.client.cookies['access_token'] = str(refresh.access_token)

        # Act
        response = self.client.post('/api/auth/delete-account/', {})

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Type DELETE to confirm account deletion')
        self.assertTrue(User.objects.filter(username='googleuser').exists())

    def test_delete_account_without_usable_password_with_incorrect_confirmation_returns_400(self):
        """
        Verifies that a user without a usable password cannot delete their account with incorrect confirmation.
        """
        # Arrange
        refresh = RefreshToken.for_user(self.google_user)
        self.client.cookies['access_token'] = str(refresh.access_token)

        # Act
        response = self.client.post('/api/auth/delete-account/', {
            'confirmation': 'delete'
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Type DELETE to confirm account deletion')
        self.assertTrue(User.objects.filter(username='googleuser').exists())

    def test_delete_account_with_unauthenticated_user_returns_401(self):
        """
        Verifies that an unauthenticated user cannot delete an account.
        """
        # Act
        response = self.client.post('/api/auth/delete-account/', {
            'password': self.password
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(User.objects.filter(username='existinguser').exists())