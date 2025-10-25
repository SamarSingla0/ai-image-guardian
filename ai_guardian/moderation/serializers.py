# moderation/serializers.py
from rest_framework import serializers
from .models import Image

class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        # 'user_id' will be read-only as it's set from the token
        fields = ['id', 'image', 'moderation_status', 'confidence', 'uploaded_at', 'user_id']
        read_only_fields = ['user_id', 'moderation_status', 'confidence']

class ModerationResultSerializer(serializers.Serializer):
    status = serializers.CharField()
    confidence = serializers.FloatField()