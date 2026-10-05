from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch
from rest_framework import status

@patch('api.views.RegisterView.throttle_classes', [])
class RegisterViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method in this class. Creates one existing user that the duplicate-
        username/email tests can reuse, so each of those tests doesn't need to repeat the same setup
        code.
        """
        self.existing_user = User.objects.create_user(
            username='existing',
            password='SecurePass123!',
            email='existing@test.com'
        )

    def test_register_success_creates_user(self):
        """
        Verifies that a successful registration saves a new User row to the database.
        """
        # Arrange
        username = 'johndoe2'
        password = 'MyPassword123!'
        email = 'myemail@email.com'

        # Act
        self.client.post('/api/auth/register/', {
            'username': username,
            'password': password,
            'email': email,
        })

        # Assert
        self.assertTrue(User.objects.filter(username=username).exists())

    def test_register_success_returns_201(self):
        """
        Verifies that a successful registration responds with 201 created.
        """
        # Arrange
        username = 'johndoe3'
        password = 'MyPassword123!'
        email = 'myemail3@email.com'

        # Act
        response = self.client.post('/api/auth/register/', {
            'username': username,
            'password': password,
            'email': email
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_missing_username_returns_400(self):
        """
        Verifies that registration without a username responds with 400 bad request.
        """
        # Arrange
        username = ''
        password = 'MyPassword123!'
        email = 'myemail4@email.com'

        # Act
        response = self.client.post('/api/auth/register/', {
            'username': username,
            'password': password,
            'email': email
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_password_returns_400(self):
        """
        Verifies that registration without a password responds with 400 bad request.
        """
        # Arrange
        username = 'johndoe4'
        password = ''
        email = 'myemail5@email.com'

        # Act
        response = self.client.post('/api/auth/register/', {
            'username': username,
            'password': password,
            'email': email
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_email_returns_400(self):
        """
        Verifies that registration without an email responds with 400 bad request.
        """
        # Arrange
        username = 'johndoe5'
        password = 'myPassword123!'
        email = ''

        # Act
        response = self.client.post('/api/auth/register/', {
            'username': username,
            'password': password,
            'email': email
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username_returns_400(self):
        """
        Verifies that registration with an username that already exists responds with 400 bad request.
        """
        # Arrange
        username = 'existing'
        password = 'MyPassword123!'
        email = 'myemail6@email.com'

        # Act
        response = self.client.post('/api/auth/register/', {
            'username': username,
            'password': password,
            'email': email
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email_returns_400(self):
        """
        Verifies that registration with an email that already exists responds with 400 bad request.
        """
        # Arrange
        username = 'johndoe6'
        password = 'myPassword123!'
        email = 'existing@test.com'
        
        # Act
        response = self.client.post('/api/auth/register/', {
            'username': username,
            'password': password,
            'email': email
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password_returns_400(self):
        """
        Verifies that registration with a password that doesn't meet Django's password validation
        requirements returns a 400 bad request.
        """
        # Arrange
        username = 'johndoe7'
        password = 'test'
        email = 'myemail7@email.com'

        # Act
        response = self.client.post('/api/auth/register/', {
            'username': username,
            'password': password,
            'email': email
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_success_sets_access_token_cookie(self):
        """
        Verfies that successful registration logs the user in immediately by setting the access_token
        cookie.
        """
        # Arrange
        username = 'johndoe8'
        password = 'MyPassword123!'
        email = 'myemail8@email.com'

        # Act
        response = self.client.post('/api/auth/register/', {
            'username': username,
            'password': password,
            'email': email
        })

        # Assert
        self.assertIn('access_token', response.cookies)

    def test_register_success_sets_refresh_token_cookie(self):
        """
        Verifies that successful registration also sets refresh_token, the second half of the cookie
        pair.
        """
        # Arrange 
        username = 'johndoe9'
        password = 'MyPassword123!'
        email = 'myemail9@email.com'

        # Act
        response = self.client.post('/api/auth/register/', {
            'username': username,
            'password': password,
            'email': email
        })

        # Assert
        self.assertIn('refresh_token', response.cookies)


class RegisterThrottleTest(TestCase):
    def test_register_throttled_after_limit(self):
        """
        Verifies that the 5th registration attempt from the same client within an hour should be
        rejected with 429. 
        """
        # Arrange & Act
        for i in range(4):
            response = self.client.post('/api/auth/register/', {
                'username': f'throttletest{i}',
                'password': '',
                'email': f'throttletest{i}@email.com'
            })

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        response = self.client.post('/api/auth/register/', {
            'username': 'throttletest5',
            'password': 'MyPassword123!',
            'email': 'throttletest5@email.com'
        })

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class CookieTokenObtainPairViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method in this class. Creates one existing user that login tests can 
        reuse, so each of those tests doesn't need to repeat the same setup code.
        """
        self.existing_user = User.objects.create_user(
            username='existingUser',
            password='MyPassword123!',
            email='existinguser@email.com'
        )

    def test_login_success_sets_access_token_cookie(self):
        """
        Verifies that a successful login logs the user immediately by setting both cookies, access_token
        and refresh_token, and returns 200 OK.
        """
        # Arrange
        username = 'existingUser'
        password = 'MyPassword123!'

        # Act
        response = self.client.post('/api/auth/login/', {
            'username': username,
            'password': password,
        })

        # Arrange
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)


class LogoutViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method in this class. Creates one existing user that the logout tests can
        reuse, so each of the tests don't need to repeat the same code.
        """
        self.existing_user = User.objects.create_user(
            username='existingUser',
            password='myPassword123!',
            email='existinguser@email.com'
        )

    def test_authenticated_logout_deletes_auth_cookie(self):
        """
        Verifies that a successful logout by an authenticated user immediately deletes both auth cookies,
        access_token and refresh_token, and returns 200 OK.
        """
        # Arrange & Act
        username = 'existingUser'
        password = 'myPassword123!'

        response = self.client.post('/api/auth/login/', {
            'username': username,
            'password': password,
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

    def test_unauthenticated_logout_returns_200(self):
        """
        Verifies that a logout done by an unauthenticated user will still return a 200 OK.
        """
        # Arrange & Act
        response = self.client.post('/api/auth/logout/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class MeViewTest(TestCase):
    def setUp(self):
        """
        Runs before every test method in this class. Creates one existing user that the MeView tests can
        reuse, so each of the tests don't need to repeat the same code.
        """
        self.existing_user = User.objects.create_user(
            username='existingUser',
            password='myPassword123!',
            email='existinguser@email.com'
        )

    def test_me_authenticated_returns_user_info(self):
        """
        Verifies that an authenticated user can retrieve their username, email, date joined, and whether
        they have a usable password.
        """
        # Arrange & Act
        username = 'existingUser'
        password = 'myPassword123!'
        email = 'existinguser@email.com'

        response = self.client.post('/api/auth/login/', {
            'username': username,
            'password': password
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Act
        response = self.client.get('/api/auth/me/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], username)
        self.assertEqual(response.data['email'], email)
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