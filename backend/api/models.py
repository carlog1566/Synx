from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Song(models.Model):
    """
    Represents an uploaded song and its chord/tab analysis results.

    owner is nullable to accomodate any legacy pre-auth data. Every song created through the
    normal upload flow always has one (assinged in SongViewset.perform_create). is_public
    controls whether other users can see this song.

    chords and tabs stay null until analyze() populates them, analyzed=True marks that this 
    happened.
    """

    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True,      # Nullable to support legacy pre-auth songs
        blank=True,     # New songs always get an owner via perform_create()
        related_name='songs'
    )
    is_public = models.BooleanField(default=False)  # For "share publicly" feature later
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    duration = models.IntegerField(default=0, help_text='Duration in seconds')
    audio_file = models.FileField(upload_to='songs/', null=True, blank=True)
    chords = models.JSONField(null=True, blank=True)
    tabs = models.JSONField(null=True, blank=True)
    analyzed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Song'
        verbose_name_plural = 'Songs'

    def __str__(self):
        return f"{self.title} - {self.artist}"