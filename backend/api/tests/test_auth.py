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
        pass

    def test_register_duplicate_email_returns_400(self):
        pass

    def test_register_weak_password_returns_400(self):
        pass

    def test_register_success_sets_access_token_cookie(self):
        pass

    def test_register_success_sets_refresh_token_cookie(self):
        pass


class RegisterThrottleTest(TestCase):
    def test_register_throttled_after_limit(self):
        pass