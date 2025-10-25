# AI Image Guardian

**AI Image Guardian** is a full-stack web application designed to automatically detect and moderate inappropriate or unsafe content in user-uploaded images. Built with Django, Firebase, and Clarifai's powerful AI, this project provides a secure, efficient, and user-friendly platform for content moderation.

Users can sign up and log in securely via Firebase Authentication, upload images, and receive instant feedback on whether their content is safe or has been flagged. The application features a modern, responsive user interface and a robust backend that handles the entire moderation workflow.

**Live Demo:** [Link to your deployed project (e.g., on PythonAnywhere, Render)] *(Add this once you deploy it!)*

![AI Image Guardian Dashboard](./path/to/your/screenshot.png)
*(Replace this with a good screenshot of your dashboard)*

---

## Features

-   **Secure User Authentication**: Full email/password sign-up and login functionality handled by Firebase Authentication.
-   **AI-Powered Content Moderation**: Utilizes the **Clarifai Moderation Workflow** to analyze uploaded images for unsafe content (NSFW, violence, explicit material, etc.).
-   **Dynamic Frontend**: A responsive, single-page application feel. The dashboard updates in real-time without requiring page reloads for uploads or deletions.
-   **Image Upload & Storage**: Supports drag-and-drop and browse-to-upload. Image files are stored and managed by Django's media storage system.
-   **Intelligent UI Feedback**:
    -   **Safe Images**: Displayed clearly with an "Approved" label.
    -   **Unsafe Images**: Automatically blurred, desaturated, and scaled down to prevent exposure, with a "Flagged" label.
-   **Full CRUD Functionality**: Users can upload, view, and delete their own images securely.
-   **Efficient Data Handling**: Implemented server-side pagination to handle a large number of images without slowing down the frontend.
-   **Django Admin Integration**: Custom admin panels for easy management and viewing of all user uploads and their moderation status.

---

## Tech Stack & Architecture

### Backend
-   **Framework**: Django + Django REST Framework
-   **Database**: PostgreSQL
-   **AI Integration**: Clarifai API (Moderation Workflow)
-   **Authentication**: Firebase Admin SDK for backend token verification
-   **File Handling**: Django's built-in media storage

### Frontend
-   **Templating**: HTML5, Django Template Language
-   **Styling**: CSS3 (with a modern, responsive design using Flexbox/Grid)
-   **JavaScript**: Vanilla JavaScript (ES6+) for dynamic UI updates, API calls (`fetch`), and interactivity.

### Authentication & Storage
-   **User Management**: Firebase Authentication (Email/Password)
-   **Image Storage**: Local filesystem storage via Django's `ImageField`.

---

## Technical Highlights & Challenges

This project was a deep dive into full-stack development and integrating multiple third-party services. Here are some of the key technical challenges I solved:

1.  **Decoupled Frontend/Backend Authentication**: One of the main challenges was creating a secure link between a Firebase-authenticated frontend and a Django backend. I implemented a custom **Django REST Framework authentication class** that validates the Firebase JWT (ID Token) sent in the `Authorization` header. This allows Django to trust the user's identity without managing passwords itself.

2.  **Robust AI API Integration**: Early attempts to call the Clarifai API with local image URLs failed due to security restrictions (`loopback IP addresses not allowed`). I solved this in two phases:
    -   First, I used **`ngrok`** to create a public tunnel to my local server, proving that the issue was network-related.
    -   I then implemented a more robust, production-ready solution by **sending the image's raw bytes (encoded in Base64)** directly to the API. This is more efficient and completely bypasses any networking issues, making the application independent of its hosting environment.

3.  **Handling File Streams in Django**: A subtle but critical bug occurred where the application would send an empty image to the AI. I diagnosed this as a file stream issue: Django was reading the file to save it, which moved the "read head" to the end. My solution was to **read the file into memory first, then call `.seek(0)` to rewind the file** before passing it to the Django model for saving. This ensured both the AI and the database received the complete file data.

---

## Getting Started

To run this project locally, follow these steps:

### Prerequisites

-   Python 3.10+
-   PostgreSQL
-   Firebase Account
-   Clarifai Account

### Local Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-image-guardian.git
    cd ai-image-guardian
    ```

2.  **Set up the environment:**
    -   Create and activate a virtual environment:
        ```bash
        python -m venv venv
        source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
        ```
    -   Install the required packages:
        ```bash
        pip install -r requirements.txt
        ```

3.  **Configure Environment Variables:**
    -   Create a `.env` file in the project root.
    -   Create a `firebase-service-account.json` file in the project root.
    -   Add the following variables to your `.env` file:
        ```.env
        DJANGO_SECRET_KEY=your_django_secret_key
        CLARIFAI_API_KEY=your_clarifai_pat_or_api_key

        # PostgreSQL Database Credentials
        DB_NAME=ai_guardian_db
        DB_USER=your_db_user
        DB_PASSWORD=your_db_password
        ```

4.  **Set up the Database:**
    -   Make sure your PostgreSQL server is running.
    -   Run the migrations to create the tables:
        ```bash
        python manage.py migrate
        ```
    -   Create a superuser to access the Django admin:
        ```bash
        python manage.py createsuperuser
        ```

5.  **Configure Firebase on the Frontend:**
    -   Open `static/js/firebase-config.js`.
    -   Paste your Firebase Web App configuration object into the `firebaseConfig` variable.

6.  **Run the application:**
    ```bash
    python manage.py runserver
    ```
    The application will be available at `http://127.0.0.1:8000/`.

---

## Future Improvements

-   **Asynchronous AI Processing**: Implement Celery and Redis to move the Clarifai API call to a background task, providing instant UI feedback to the user.
-   **Cloud Storage**: Integrate Amazon S3 for media file storage to make the application fully scalable and production-ready.
-   **Unit & Integration Tests**: Add a comprehensive test suite to ensure code reliability and prevent regressions.
-   **Moderator Role**: Expand the application with a "moderator" role and a dedicated queue for manually reviewing and approving flagged images.
