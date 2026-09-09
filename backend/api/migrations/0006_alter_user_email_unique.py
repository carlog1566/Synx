from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0005_song_is_public_song_owner')
    ]

    operations = [
        migrations.RunSQL(
            "ALTER TABLE auth_user ADD CONSTRAINT unique_email UNIQUE (email);",
            reverse_sql="ALTER TABLE auth_user DROP CONSTRAINT unique_email;"
        )
    ]