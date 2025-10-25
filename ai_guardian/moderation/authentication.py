# moderation/authentication.py
import os
import firebase_admin
from types import SimpleNamespace
from firebase_admin import credentials, auth
from rest_framework import authentication
from rest_framework import exceptions
from django.conf import settings

# Initialize Firebase Admin SDK if not already done
if not firebase_admin._apps:
    cred_path = os.path.join(settings.BASE_DIR, 'firebase-service-account.json')
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return None # No token provided

        try:
            id_token = auth_header.split(' ').pop()
            decoded_token = auth.verify_id_token(id_token)
        except (IndexError, auth.InvalidIdTokenError, auth.ExpiredIdTokenError) as e:
            raise exceptions.AuthenticationFailed(f'Invalid or expired token: {e}')

        if not id_token or not decoded_token:
            return None

        # Create a simple user object that has the 'is_authenticated' attribute.
        user = SimpleNamespace(
            is_authenticated=True, 
            **decoded_token
        )

        return (user, None)