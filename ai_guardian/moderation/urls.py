# moderation/urls.py
from django.urls import path
from .views import ModerationView, ImageListView, ImageDetailView

urlpatterns = [
    path('moderate/', ModerationView.as_view(), name='moderate-image'),
    path('images/', ImageListView.as_view(), name='image-list'),
    path('images/<int:pk>/', ImageDetailView.as_view(), name='image-detail'),
]