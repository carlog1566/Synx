from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status

class RegisterViewTest(TestCase):
    def setUp(self):
        pass

    def test_register_success_creates_user(self):
        pass

    def test_register_success_returns_201(self):
        pass

    def test_register_missing_username_returns_400(self):
        pass

    def test_register_missing_password_returns_400(self):
        pass

    def test_register_missing_email_returns_400(self):
        pass

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

    def test_register_throttled_after_limit(self):
        pass