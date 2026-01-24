from django.db import models

# Create your models here.
class Song(models.Model):
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    duration = models.IntegerField(default=0, help_text='Duration in seconds')
    audio_file = models.FileField(upload_to='songs/', null=True, blank=True)
    chords = models.JSONField(null=True, blank=True)
    analyzed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Song'
        verbose_name_plural = 'Songs'

    def __str__(self):
        return f"{self.title} - {self.artist}"