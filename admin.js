const SUPABASE_URL = 'https://bgcsmwrqkujkgmujobxn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KtJzFbC82YvllhlQAEgrvA_xuTDJmHK';
const STORAGE_BUCKET = 'website-images';

const loginPanel = document.getElementById('login-panel');
const dashboardPanel = document.getElementById('dashboard-panel');
const loginForm = document.getElementById('login-form');
const uploadForm = document.getElementById('upload-form');
const imageTargetSelect = document.getElementById('image-target');
const imageFileInput = document.getElementById('image-file');
const uploadDropzone = document.getElementById('upload-dropzone');
const currentImagePanel = document.getElementById('current-image-panel');
const currentImage = document.getElementById('current-image');
const selectedImagePanel = document.getElementById('selected-image-panel');
const selectedImagePreview = document.getElementById('selected-image');
const selectedImageName = document.getElementById('selected-image-name');
const saveImageButton = document.getElementById('save-image-button');
const removeImageButton = document.getElementById('remove-image-button');
const logoutButton = document.getElementById('logout-button');
const loginMessage = document.getElementById('login-message');
const dashboardMessage = document.getElementById('dashboard-message');
let selectedImageFile = null;
let selectedImagePreviewUrl = '';
let currentImageExists = false;
let imageOperationInProgress = false;
let currentImageRequest = 0;

const isConfigured = !SUPABASE_URL.startsWith('YOUR_') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
const supabaseClient = isConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function showMessage(element, message, isError = true) {
    element.textContent = message;
    element.style.color = isError ? '#8b2f2f' : '#2d6a4f';
}

function showDashboard(isVisible) {
    loginPanel.classList.toggle('admin-hidden', isVisible);
    dashboardPanel.classList.toggle('admin-hidden', !isVisible);
    if (isVisible) refreshCurrentImage();
}

function getManagedImagePath() {
    return `homepage/${imageTargetSelect.value}`;
}

function refreshCurrentImage() {
    const request = ++currentImageRequest;
    const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(getManagedImagePath());

    currentImageExists = false;
    currentImagePanel.classList.add('admin-hidden');
    removeImageButton.disabled = true;
    currentImage.onload = () => {
        if (request !== currentImageRequest) return;
        currentImageExists = true;
        currentImagePanel.classList.remove('admin-hidden');
        removeImageButton.disabled = imageOperationInProgress;
    };
    currentImage.onerror = () => {
        if (request !== currentImageRequest) return;
        currentImageExists = false;
        currentImagePanel.classList.add('admin-hidden');
        removeImageButton.disabled = true;
    };
    currentImage.src = `${data.publicUrl}?v=${Date.now()}`;
}

function previewSelectedImage(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showMessage(dashboardMessage, 'Please choose an image file.');
        imageFileInput.value = '';
        return;
    }

    if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
    selectedImageFile = file;
    selectedImagePreviewUrl = URL.createObjectURL(file);
    selectedImagePreview.src = selectedImagePreviewUrl;
    selectedImageName.textContent = `New image: ${file.name}`;
    selectedImagePanel.classList.remove('admin-hidden');
    saveImageButton.disabled = imageOperationInProgress;
    showMessage(dashboardMessage, 'Preview ready. Select “Save / Replace Image” to publish it.', false);
}

function setImageOperationState(isBusy) {
    imageOperationInProgress = isBusy;
    uploadDropzone.setAttribute('aria-disabled', String(isBusy));
    saveImageButton.disabled = isBusy || !selectedImageFile;
    removeImageButton.disabled = isBusy || !currentImageExists;
}

if (!isConfigured) {
    showMessage(loginMessage, 'Supabase configuration is pending. Add the project URL and anon key in admin.js.');
    loginForm.querySelector('button').disabled = true;
}

loginForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (!supabaseClient) return;

    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showMessage(loginMessage, error.message);
        return;
    }

    showMessage(loginMessage, 'Login successful.', false);
    showDashboard(true);
});

async function saveSelectedImage(event) {
    event.preventDefault();
    if (!supabaseClient || !selectedImageFile || imageOperationInProgress) return;

    setImageOperationState(true);
    showMessage(dashboardMessage, 'Saving image to the selected website section...', false);

    const storage = supabaseClient.storage.from(STORAGE_BUCKET);
    const path = getManagedImagePath();

    try {
        if (currentImageExists) {
            const { error: removeError } = await storage.remove([path]);
            if (removeError) throw removeError;
            currentImageExists = false;
        }

        const { error } = await storage.upload(path, selectedImageFile, {
            cacheControl: '0',
            contentType: selectedImageFile.type,
            upsert: false
        });
        if (error) throw error;

        selectedImageFile = null;
        selectedImagePanel.classList.add('admin-hidden');
        if (selectedImagePreviewUrl) URL.revokeObjectURL(selectedImagePreviewUrl);
        selectedImagePreviewUrl = '';
        imageFileInput.value = '';
        showMessage(dashboardMessage, 'Image saved. It will now appear in this section on the website.', false);
        refreshCurrentImage();
    } catch (error) {
        showMessage(dashboardMessage, `Could not save image: ${error.message || 'Please check your connection and try again.'}`);
    } finally {
        setImageOperationState(false);
    }
}

imageFileInput.addEventListener('change', () => {
    previewSelectedImage(imageFileInput.files[0]);
});

imageTargetSelect.addEventListener('change', () => {
    refreshCurrentImage();
});

uploadForm.addEventListener('submit', saveSelectedImage);

uploadDropzone.addEventListener('dragover', event => {
    event.preventDefault();
    if (!imageOperationInProgress) uploadDropzone.classList.add('drag-over');
});

uploadDropzone.addEventListener('dragleave', event => {
    if (!uploadDropzone.contains(event.relatedTarget)) {
        uploadDropzone.classList.remove('drag-over');
    }
});

uploadDropzone.addEventListener('drop', event => {
    event.preventDefault();
    uploadDropzone.classList.remove('drag-over');
    if (imageOperationInProgress) return;
    if (event.dataTransfer.files.length > 1) {
        showMessage(dashboardMessage, 'Choose one image for this section at a time.');
        return;
    }
    previewSelectedImage(event.dataTransfer.files[0]);
});

removeImageButton.addEventListener('click', async () => {
    if (!supabaseClient || !currentImageExists || imageOperationInProgress) return;
    const sectionName = imageTargetSelect.selectedOptions[0].text;
    if (!window.confirm(`Remove the current image from ${sectionName}?`)) return;

    setImageOperationState(true);
    showMessage(dashboardMessage, 'Removing image...', false);
    try {
        const { error } = await supabaseClient.storage.from(STORAGE_BUCKET).remove([getManagedImagePath()]);
        if (error) throw error;
        currentImageExists = false;
        currentImagePanel.classList.add('admin-hidden');
        showMessage(dashboardMessage, 'Image removed from this website section.', false);
    } catch (error) {
        showMessage(dashboardMessage, `Could not remove image: ${error.message || 'Please try again.'}`);
    } finally {
        setImageOperationState(false);
    }
});

logoutButton.addEventListener('click', async () => {
    if (!supabaseClient) return;

    await supabaseClient.auth.signOut();
    showDashboard(false);
    showMessage(loginMessage, 'You have been logged out.', false);
});

if (supabaseClient) {
    supabaseClient.auth.getSession().then(({ data }) => {
        if (data.session) showDashboard(true);
    });
}