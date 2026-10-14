from unittest.mock import patch
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import Song

class SongViewsetTest(TestCase):
    def setUp(self):
        """
        Runs before every test method. Creates two users and their public/private songs
        to test song visibility, ownership, and CRUD operations.
        """
        self.user = User.objects.create_user(
            username='songowner',
            email='owner@email.com',
            password='myPassword123!'
        )
        self.other_user = User.objects.create_user(
            username='anotheruser',
            email='another@email.com',
            password='anotherPassword123!'
        )

        self.client.cookies['access_token'] = str(RefreshToken.for_user(user).access_token)

        self.own_private_song = Song.objects.create(
            owner=self.user, 
            title='My Private Song', 
            artist='Artist A',
            is_public=False
        )
        self.own_public_song = Song.objects.create(
            owner=self.user, 
            title='My Public Song', 
            artist='Artist B',
            is_public=True
        )
        self.other_private_song = Song.objects.create(
            owner=self.other_user, 
            title='Other Private Song', 
            artist='Artist C',
            is_public=False
        )
        self.other_public_song = Song.objects.create(
            owner=self.other_user, 
            title='Other Public Song', 
            artist='Artist D',
            is_public=True
        )


class SongStatsViewTest(TestCase):
    def setUp(self):
        """
        Creates songs for two users to verify that stats are owner-scoped.
        """
        self.user = User.objects.create_user(
            username='statsuser', 
            password='myPassword123!'
        )
        self.other_user = User.objects.create_user(
            username='otherstatsuser', 
            password='myPassword123!'
        )

        self.client.cookies['access_token'] = str(RefreshToken.for_user(self.user).access_token)

        Song.objects.create(
            owner=self.user, 
            title='Analyzed', 
            analyzed=True
        )
        Song.objects.create(
            owner=self.user, 
            title='Not Analyzed', 
            analyzed=False
        )
        Song.objects.create(
            owner=self.other_user, 
            title='Other Analyzed', 
            analyzed=True
        )