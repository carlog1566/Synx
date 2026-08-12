from rest_framework import serializers
from django.conf import settings
import librosa
import boto3
from .models import Song

class SongSerializer(serializers.ModelSerializer):
    audio_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = ['id', 'title', 'artist', 'duration', 'audio_file', 'audio_file_url', 'chords', 'tabs', 'analyzed', 'created_at']
        read_only_fields = ['id', 'duration', 'chords', 'tabs', 'analyzed', 'created_at']


    def create(self, validated_data):
        song = Song.objects.create(**validated_data)

        if song.audio_file:
            try:
                if settings.USE_S3:
                    import tempfile, os
                    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
                        for chunk in song.audio_file.chunks():
                            tmp.write(chunk)
                        tmp_path = tmp.name
                    try:
                        duration = librosa.get_duration(path=tmp_path)
                    finally:
                        os.unlink(tmp_path)
                else:
                    duration = librosa.get_duration(path=song.audio_file.path)

                song.duration = int(duration)
                song.save()
            except Exception as e:
                print(f'Duration detection failed: {e}')

        return song


    def get_audio_file_url(self, obj):
        if not obj.audio_file:
            return None

        if settings.USE_S3:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME
            )
            return s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'Key': obj.audio_file.name
                },
                ExpiresIn=3600
            )
        return obj.audio_file.url