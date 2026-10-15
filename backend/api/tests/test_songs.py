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

        self.client.cookies['access_token'] = str(RefreshToken.for_user(self.user).access_token)

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

    def detail_url(self, song):
        return f'/api/songs/{song.pk}/'

    def toggle_url(self, song):
        return f'/api/songs/{song.pk}/toggle_public/'

    def analyze_url(self, song):
        return f'/api/songs/{song.pk}/analyze/'

    def test_list_includes_own_private_and_public_songs(self):
        """
        Verifies that the owner can list both their private and public songs.
        """
        # Arrange & Act
        response = self.client.get('/api/songs/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item['id'] for item in response.data}
        self.assertIn(self.own_private_song.pk, ids)
        self.assertIn(self.own_public_song.pk, ids)

    def test_list_includes_other_users_public_songs(self):
        """
        Verifies that a user can see public songs belonging to other users.
        """
        # Arrange & Act
        response = self.client.get('/api/songs/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item['id'] for item in response.data}
        self.assertIn(self.other_public_song.pk, ids)

    def test_list_excludes_other_users_private_songs(self):
        """
        Verifies that another user's private songs are not listed.
        """
        # Arrange & Act
        response = self.client.get('/api/songs/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item['id'] for item in response.data}
        self.assertNotIn(self.other_private_song.pk, ids)

    def test_retrieve_own_private_song_returns_200(self):
        """
        Verifies that an owner can retrieve their private song.
        """
        # Arrange & Act
        response = self.client.get(self.detail_url(self.own_private_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.own_private_song.pk)

    def test_retrieve_other_users_public_song_returns_200(self):
        """
        Verifies that another user's public song can be retrieved.
        """
        # Arrange & Act
        response = self.client.get(self.detail_url(self.other_public_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.other_public_song.pk)

    def test_retrieve_other_users_private_song_returns_404(self):
        """
        Verifies that another user's private song cannot be retrieved.
        """
        # Arrange & Act
        response = self.client.get(self.detail_url(self.other_private_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_song_assigns_authenticated_user(self):
        """
        Verifies that creating a song assigns it to the current user.
        """
        # Arrange & Act
        response = self.client.post('/api/songs/', {
            'title': 'Created Song',
            'artist': 'Created Artist',
            'is_public': False
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_song = Song.objects.get(pk=response.data['id'])
        self.assertEqual(created_song.owner, self.user)
        self.assertEqual(created_song.title, 'Created Song')

    def test_create_song_cannot_assign_another_owner(self):
        """
        Verifies that a request body cannot override the authenticated owner.
        """
        # Arrange & Act
        response = self.client.post('/api/songs/', {
            'title': 'Ownership Test',
            'artist': 'Created Artist',
            'owner': self.other_user.pk
        })

        # Assert
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_song = Song.objects.get(pk=response.data['id'])
        self.assertEqual(created_song.owner, self.user)

    def test_update_own_song_returns_200(self):
        """
        Verifies that owners can change their own song's metadata.
        """
        # Arrange & Act
        response = self.client.patch(
            self.detail_url(self.own_private_song),
            {'title': 'Updated Title'},
            content_type='application/json'
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.own_private_song.refresh_from_db()
        self.assertEqual(self.own_private_song.title, 'Updated Title')

    def test_update_other_users_private_song_returns_404(self):
        """
        Verifies that a user's private song cannot be changed by others.
        """
        # Arrange & Act
        response = self.client.patch(
            self.detail_url(self.other_private_song),
            {'title': 'Unauthorized Update'},
            content_type='application/json'
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.other_private_song.refresh_from_db()
        self.assertEqual(self.other_private_song.title, 'Other Private Song')

    def test_update_other_users_public_song_is_forbidden(self):
        """
        Verifies that public visibility does not grant permission to edit.
        """
        # Arrange & Act
        response = self.client.patch(
            self.detail_url(self.other_public_song),
            {'title': 'Unauthorized Update'},
            content_type='application/json'
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.other_public_song.refresh_from_db()
        self.assertEqual(self.other_public_song.title, 'Other Public Song')

    def test_delete_own_song_returns_204(self):
        """
        Verifies that owners can delete their own songs.
        """
        # Arrange & Act
        response = self.client.delete(self.detail_url(self.own_private_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Song.objects.filter(pk=self.own_private_song.pk).exists())

    def test_delete_other_users_private_song_returns_404(self):
        """
        Verifies that other users cannot delete private songs.
        """
        # Arrange & Act
        response = self.client.delete(self.detail_url(self.other_private_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Song.objects.filter(pk=self.other_private_song.pk).exists())

    def test_delete_other_users_public_song_is_forbidden(self):
        """
        Verifies that public songs cannot be deleted by nonowners.
        """
        # Arrange & Act
        response = self.client.delete(self.detail_url(self.other_public_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Song.objects.filter(pk=self.other_public_song.pk).exists())

    def test_toggle_public_own_song_returns_200(self):
        """
        Verifies that owners can change a song's visibility.
        """
        # Arrange & Act
        response = self.client.patch(self.toggle_url(self.own_private_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.own_private_song.refresh_from_db()
        self.assertTrue(self.own_private_song.is_public)

    def test_toggle_public_twice_restores_original_visibility(self):
        """
        Verifies that toggling visibility twice returns it to its initial value.
        """
        # Arrange & Act
        first_response = self.client.patch(self.toggle_url(self.own_private_song))
        second_response = self.client.patch(self.toggle_url(self.own_private_song))

        # Assert
        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.own_private_song.refresh_from_db()
        self.assertFalse(self.own_private_song.is_public)

    def test_toggle_public_other_users_private_song_returns_404(self):
        """
        Verifies that another user's private song cannot be toggled.
        """
        # Arrange & Act
        response = self.client.patch(self.toggle_url(self.other_private_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.other_private_song.refresh_from_db()
        self.assertFalse(self.other_private_song.is_public)

    def test_toggle_public_other_users_public_song_is_forbidden(self):
        """
        Verifies that public songs cannot be made private by non-owners.
        """
        # Arrange & Act
        response = self.client.patch(self.toggle_url(self.other_public_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.other_public_song.refresh_from_db()
        self.assertTrue(self.other_public_song.is_public)

    def test_analyze_song_without_audio_returns_400(self):
        """
        Verifies that analysis rejects a song without an audio file.
        """
        # Arrange & Act
        response = self.client.post(self.analyze_url(self.own_private_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'No audio file')

    @override_settings(USE_S3=False)
    @patch('api.views.TabGenerator.generate')
    @patch('api.views.ChordDetector.analyze')
    def test_analyze_own_song_saves_chords_and_tabs(self, mock_analyze, mock_generate):
        """
        Verifies that successful analysis saves chords, tabs, and analyzed=True.
        """
        # Arrange
        self.own_private_song.audio_file = 'songs/fake.mp3'
        self.own_private_song.save()
        expected_chords = [{'time': 0, 'chord': 'C'}]
        expected_tabs = 'mock guitar tabs'
        mock_analyze.return_value = expected_chords
        mock_generate.return_value = expected_tabs

        # Act
        response = self.client.post(self.analyze_url(self.own_private_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.own_private_song.refresh_from_db()
        self.assertTrue(self.own_private_song.analyzed)
        self.assertEqual(self.own_private_song.chords, expected_chords)
        self.assertEqual(self.own_private_song.tabs, {'guitar': expected_tabs})
        mock_analyze.assert_called_once()
        mock_generate.assert_called_once_with(expected_chords, 'guitar')

    @override_settings(USE_S3=False)
    @patch('api.views.ChordDetector.analyze')
    def test_analyze_detector_failure_returns_500_without_saving(self, mock_analyze):
        """
        Verifies that a detector error returns 500 without marking analysis complete.
        """
        # Arrange
        self.own_private_song.audio_file = 'songs/fake.mp3'
        self.own_private_song.save()
        mock_analyze.side_effect = RuntimeError('Analysis failed')

        # Act
        response = self.client.post(self.analyze_url(self.own_private_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data['error'], 'Analysis failed')
        self.own_private_song.refresh_from_db()
        self.assertFalse(self.own_private_song.analyzed)

    def test_analyze_other_users_private_song_returns_404(self):
        """
        Verifies that another user's private song cannot be analyzed.
        """
        # Arrange & Act
        response = self.client.post(self.analyze_url(self.other_private_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch('api.views.ChordDetector.analyze')
    def test_analyze_other_users_public_song_is_forbidden(self, mock_analyze):
        """
        Verifies that a public song cannot be analyzed by a nonowner.
        """
        # Arrange
        self.other_public_song.audio_file = 'songs/fake.mp3'
        self.other_public_song.save()

        # Act
        response = self.client.post(self.analyze_url(self.other_public_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.other_public_song.refresh_from_db()
        self.assertFalse(self.other_public_song.analyzed)
        mock_analyze.assert_not_called()

    def test_list_unauthenticated_returns_401(self):
        """
        Verifies that unauthenticated users cannot view the song list.
        """
        # Arrange
        self.client.cookies.clear()

        # Act
        response = self.client.get('/api/songs/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_unauthenticated_returns_401(self):
        """
        Verifies that unauthenticated users cannot retrieve songs.
        """
        # Arrange
        self.client.cookies.clear()

        # Act
        response = self.client.get(self.detail_url(self.own_public_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        """
        Verifies that unauthenticated users cannot create songs.
        """
        # Arrange
        self.client.cookies.clear()

        # Act
        response = self.client.post('/api/songs/', {'title': 'Unauthorized Song'})

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_unauthenticated_returns_401(self):
        """
        Verifies that unauthenticated users cannot update songs.
        """
        # Arrange
        self.client.cookies.clear()

        # Act
        response = self.client.patch(
            self.detail_url(self.own_public_song),
            {'title': 'Unauthorized Update'},
            content_type='application/json'
        )

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_unauthenticated_returns_401(self):
        """
        Verifies that unauthenticated users cannot delete songs.
        """
        # Arrange
        self.client.cookies.clear()

        # Act
        response = self.client.delete(self.detail_url(self.own_public_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_toggle_public_unauthenticated_returns_401(self):
        """
        Verifies that unauthenticated users cannot toggle visibility.
        """
        # Arrange
        self.client.cookies.clear()

        # Act
        response = self.client.patch(self.toggle_url(self.own_public_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_analyze_unauthenticated_returns_401(self):
        """
        Verifies that unauthenticated users cannot analyze songs.
        """
        # Arrange
        self.client.cookies.clear()

        # Act
        response = self.client.post(self.analyze_url(self.own_public_song))

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)



class SongStatsViewTest(TestCase):
    def setUp(self):
        """
        Creates songs for two users to verify that stats are owner-scoped.
        """
        self.user = User.objects.create_user(
            username='statsuser',
            email='statsuser@email.com',
            password='myPassword123!'
        )
        self.other_user = User.objects.create_user(
            username='otherstatsuser',
            email='otherstatsuser@email.com',
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

    def test_stats_counts_only_authenticated_users_songs(self):
        """
        Verifies that statistics exclude songs owned by other users.
        """
        # Arrange & Act
        response = self.client.get('/api/auth/stats/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_songs'], 2)
        self.assertEqual(response.data['analyzed_songs'], 1)

    def test_stats_unauthenticated_returns_401(self):
        """
        Verifies that unauthenticated users cannot retrieve song statistics.
        """
        # Arrange
        self.client.cookies.clear()

        # Act
        response = self.client.get('/api/auth/stats/')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)