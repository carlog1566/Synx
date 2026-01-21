from django.db import models

# Create your models here.
class Song(models.Model):
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    duration = models.IntegerField(default=0, help_text='Duration in seconds')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Song'
        verbose_name_plural = 'Songs'

    def __str__(self):
        return f"{self.title} - {self.artist}"