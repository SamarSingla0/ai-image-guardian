# moderation/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Image, Profile

@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    # Columns to display in the list view
    list_display = ('user_id', 'moderation_status', 'confidence', 'uploaded_at', 'image_preview')
    # A sidebar for filtering
    list_filter = ('moderation_status', 'uploaded_at')
    # Make fields that are set by the system read-only
    readonly_fields = ('user_id', 'uploaded_at', 'image_preview')
    # Allow searching by user ID
    search_fields = ('user_id',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="100" style="border-radius: 5px;" />', obj.image.url)
        return "No Image"
    image_preview.short_description = 'Preview'

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'role')
    search_fields = ('user_id',)