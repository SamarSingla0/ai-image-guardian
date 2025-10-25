# moderation/models.py
from django.db import models

class Image(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('safe', 'Safe'),
        ('unsafe', 'Unsafe'),
    ]

    # We store the Firebase User ID (UID) as a string.
    user_id = models.CharField(max_length=255, db_index=True)
    # 'uploads/' will be a subfolder within your MEDIA_ROOT
    image = models.ImageField(upload_to='uploads/')
    moderation_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    confidence = models.FloatField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for user {self.user_id} at {self.uploaded_at.strftime('%Y-%m-%d %H:%M')}"

# --- THIS PROFILE MODEL WAS MISSING ---
class Profile(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('moderator', 'Moderator'),
    ]
    user_id = models.CharField(max_length=255, primary_key=True, unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')

    def __str__(self):
        return f"{self.user_id} - {self.role}"