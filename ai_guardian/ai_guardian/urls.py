# ai_guardian/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from moderation.views import login_view, dashboard_view # Import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('moderation.urls')),

    # Frontend Paths
    path('', login_view, name='login'), # Root URL
    path('dashboard/', dashboard_view, name='dashboard'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)