// static/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;

    // A global variable to hold the current page URL for pagination
    let currentImagesUrl = '/api/images/';

    // =================================================================
    // --- AUTHENTICATION & PAGE ROUTING ---
    // =================================================================

    const handleAuth = () => {
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                if (currentPath === '/' || currentPath.includes('login')) {
                    window.location.replace('/dashboard/');
                } else if (currentPath.includes('dashboard')) {
                    document.getElementById('user-email').textContent = user.email;
                    fetchUserImages(); // Fetch the first page of images on load
                }
            } else {
                // User is signed out
                if (currentPath.includes('dashboard')) {
                    window.location.replace('/');
                }
            }
        });
    };

    // =================================================================
    // --- EVENT LISTENER SETUP ---
    // =================================================================

    const setupListeners = () => {
        if (currentPath === '/' || currentPath.includes('login')) {
            setupLoginListeners();
        } else if (currentPath.includes('dashboard')) {
            setupDashboardListeners();
        }
    };

    const setupLoginListeners = () => {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const errorMessage = document.getElementById('error-message');
        const loginButton = document.getElementById('login-button');
        const signupButton = document.getElementById('signup-button');

        if (loginButton) {
            loginButton.addEventListener('click', e => {
                e.preventDefault();
                auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
                    .catch(error => { errorMessage.textContent = error.message; });
            });
        }
        if (signupButton) {
            signupButton.addEventListener('click', () => {
                auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
                    .catch(error => { errorMessage.textContent = error.message; });
            });
        }
    };

    const setupDashboardListeners = () => {
        // Logout Button
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) logoutButton.addEventListener('click', () => auth.signOut());

        // Drag & Drop Upload
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        if (dropZone) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
            dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('drag-over'); });
            dropZone.addEventListener('drop', e => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) { handleFileUpload(e.dataTransfer.files[0]); }
            });
            if (fileInput) fileInput.addEventListener('change', e => {
                if (e.target.files.length > 0) { handleFileUpload(e.target.files[0]); }
            });
        }

        // Delete Button Listener (using event delegation)
        const imageGrid = document.getElementById('image-grid');
        if (imageGrid) {
            imageGrid.addEventListener('click', (event) => {
                if (event.target.classList.contains('delete-btn')) {
                    handleDeleteImage(event.target);
                }
            });
        }

        // Pagination Button Listeners
        const prevButton = document.getElementById('prev-button');
        const nextButton = document.getElementById('next-button');
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (!prevButton.disabled) {
                    fetchUserImages(prevButton.dataset.url);
                }
            });
        }
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (!nextButton.disabled) {
                    fetchUserImages(nextButton.dataset.url);
                }
            });
        }
    };

    // =================================================================
    // --- CORE LOGIC & HELPER FUNCTIONS ---
    // =================================================================

    const handleFileUpload = async (file) => {
        const user = auth.currentUser;
        if (!user) {
            showToast('You must be logged in to upload.', 'error');
            return;
        }
        const idToken = await user.getIdToken();
        const formData = new FormData();
        formData.append('image', file);

        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        progressContainer.style.display = 'block';
        progressBar.style.width = '50%';

        try {
            const response = await fetch('/api/moderate/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` },
                body: formData
            });
            progressBar.style.width = '100%';
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Could not parse server error.' }));
                throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
            }
            const result = await response.json();
            showToast(`Image processed: ${result.status}`, 'success');
            fetchUserImages(); // Refresh the grid to show the new image
        } catch (error) {
            showToast(error.message, 'error');
            progressBar.style.width = '0%';
        } finally {
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
            }, 2000);
        }
    };

    const handleDeleteImage = async (button) => {
        const imageId = button.dataset.imageId;

        if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            showToast('You must be logged in to perform this action.', 'error');
            return;
        }

        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/images/${imageId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });

            if (!response.ok && response.status !== 204) {
                const errorData = await response.json().catch(() => ({ 'detail': 'Failed to delete image.' }));
                throw new Error(errorData.detail);
            }

            showToast('Image deleted successfully.', 'success');

            fetchUserImages(currentImagesUrl);

        } catch (error) {
            console.error('Delete Error:', error);
            showToast(error.message, 'error');
        }
    };

    const fetchUserImages = async (url = '/api/images/') => {
        const user = auth.currentUser;
        if (!user) return;

        currentImagesUrl = url;

        const idToken = await user.getIdToken();
        const imageGrid = document.getElementById('image-grid');
        imageGrid.innerHTML = '<p>Loading images...</p>';

        try {
            const response = await fetch(currentImagesUrl, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!response.ok) throw new Error('Could not fetch images.');

            const data = await response.json();
            renderImages(data.results);
            updatePaginationControls(data);

        } catch (error) {
            imageGrid.innerHTML = '<p>Could not load images. Please try again later.</p>';
        }
    };

    const updatePaginationControls = (data) => {
        const prevButton = document.getElementById('prev-button');
        const nextButton = document.getElementById('next-button');
        const pageIndicator = document.getElementById('page-indicator');

        if (data.previous) {
            prevButton.disabled = false;
            prevButton.dataset.url = data.previous;
        } else {
            prevButton.disabled = true;
        }

        if (data.next) {
            nextButton.disabled = false;
            nextButton.dataset.url = data.next;
        } else {
            nextButton.disabled = true;
        }

        const pageSize = 3; // Match Django's PAGE_SIZE
        const totalPages = Math.ceil(data.count / pageSize) || 1;

        let currentPage;
        if (data.next) {
            currentPage = new URL(data.next).searchParams.get('page') - 1;
        } else if (data.previous) {
            const prevPage = parseInt(new URL(data.previous).searchParams.get('page') || '0');
            currentPage = prevPage + 1;
        } else {
            currentPage = 1;
        }

        pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    };

    const renderImages = (images) => {
        const imageGrid = document.getElementById('image-grid');
        imageGrid.innerHTML = '';
        if (images.length === 0) {
            imageGrid.innerHTML = '<p>No images uploaded yet.</p>';
            return;
        }
        images.forEach(img => {
            const card = document.createElement('div');
            card.className = `image-card ${img.moderation_status}`;
            const imageEl = document.createElement('img');
            imageEl.src = img.image;
            const statusLabel = document.createElement('div');
            statusLabel.className = 'status-label';
            if (img.moderation_status === 'safe') {
                statusLabel.textContent = `✅ Approved (${(img.confidence * 100).toFixed(0)}%)`;
            } else {
                statusLabel.textContent = `⚠️ Flagged as Unsafe (${(img.confidence * 100).toFixed(0)}%)`;
            }
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.innerHTML = '&times;';
            deleteButton.dataset.imageId = img.id;
            card.appendChild(imageEl);
            card.appendChild(statusLabel);
            card.appendChild(deleteButton);
            imageGrid.appendChild(card);
        });
    };

    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 5000);
    };

    // =================================================================
    // --- INITIALIZE THE APP ---
    // =================================================================

    handleAuth();
    setupListeners();
});