# moderation/views.py
import os
import requests
import json
import base64
from django.shortcuts import render

# DRF Imports
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework import status, permissions

# Local App Imports
from .authentication import FirebaseAuthentication
from .models import Image, Profile
from .serializers import ImageSerializer, ModerationResultSerializer

# --- FINAL STABLE CONFIGURATION: The Official Moderation Workflow ---
CLARIFAI_API_KEY = os.getenv('CLARIFAI_API_KEY') # Your PAT key from .env
WORKFLOW_ID = 'Moderation' # The ID for the stable, pre-built workflow

# The URL for calling a workflow
MODERATION_URL = f"https://api.clarifai.com/v2/workflows/{WORKFLOW_ID}/results"

# This workflow returns many concepts. We'll check for any of these.
UNSAFE_CONCEPTS = {
    "explicit", "gore", "drug", "suggestive", "violence", "weapons", "nsfw", 
    "graphic", "obscene", "gruesome", "erotica", "sexual"
}
CONFIDENCE_THRESHOLD = 0.70 # Flag if 70% or more confident


class ModerationView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if 'image' not in request.data:
            return Response({'error': 'Image file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        image_file = request.data['image']
        user_uid = request.user.uid

        # 1. Read the file's content into memory FIRST.
        image_bytes = image_file.read()
        
        # 2. IMPORTANT: Rewind the file pointer to the beginning.
        # This allows Django to read it again when saving the model.
        image_file.seek(0)
        
        # 3. Now, create the database record. Django can now read the file.
        image_instance = Image.objects.create(user_id=user_uid, image=image_file)

        # Encode the bytes we read earlier into a Base64 string for the JSON payload.
        base64_bytes = base64.b64encode(image_bytes)
        base64_string = base64_bytes.decode('utf-8')

        headers = {'Authorization': f'Key {CLARIFAI_API_KEY}'}
        
        # The payload now sends the 'base64' data instead of the 'url'.
        payload = {
            "user_app_id": {
                "user_id": "clarifai",
                "app_id": "main"
            },
            "inputs": [{"data": {"image": {"base64": base64_string}}}]
        }
        
        try:
            response = requests.post(MODERATION_URL, json=payload, headers=headers)
            response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
            ai_data = response.json()

            # The parsing logic for the workflow response
            is_unsafe = False
            flagged_confidence = 0.0

            for output in ai_data.get('results', [])[0].get('outputs', []):
                concepts = output.get('data', {}).get('concepts', [])
                for concept in concepts:
                    concept_name = concept.get('name', '').lower()
                    concept_value = concept.get('value', 0.0)
                    
                    if concept_name in UNSAFE_CONCEPTS and concept_value > CONFIDENCE_THRESHOLD:
                        is_unsafe = True
                        flagged_confidence = concept_value
                        break # Stop checking once we find one unsafe concept
                if is_unsafe:
                    break

            image_instance.moderation_status = 'unsafe' if is_unsafe else 'safe'
            image_instance.confidence = flagged_confidence if is_unsafe else (1 - flagged_confidence)
            image_instance.save()
            
            serializer = ModerationResultSerializer(data={'status': image_instance.moderation_status, 'confidence': image_instance.confidence})
            serializer.is_valid(raise_exception=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            # If anything goes wrong, delete the placeholder image record
            image_instance.delete()
            error_text = f'An unexpected error occurred: {str(e)}'
            # Try to get the specific error from the API response if possible
            try: error_text = response.text
            except NameError: pass
            return Response({'error': error_text}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ImageListView(ListAPIView):
    """
    Handles listing images for the authenticated user, with pagination.
    """
    serializer_class = ImageSerializer
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Security: Ensures a user can only ever see their own images.
        user_uid = self.request.user.uid
        return Image.objects.filter(user_id=user_uid).order_by('-uploaded_at')


class ImageDetailView(RetrieveUpdateDestroyAPIView):
    """
    Handles retrieving and deleting a single image instance.
    """
    serializer_class = ImageSerializer
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Security: Ensures a user can only ever access or delete their own images.
        user_uid = self.request.user.uid
        return Image.objects.filter(user_id=user_uid)


# Views for rendering the frontend HTML templates
def login_view(request):
    return render(request, 'login.html')

def dashboard_view(request):
    return render(request, 'dashboard.html')