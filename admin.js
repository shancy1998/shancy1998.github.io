const SUPABASE_URL = 'https://bgcsmwrqkujkgmujobxn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KtJzFbC82YvllhlQAEgrvA_xuTDJmHK';
const STORAGE_BUCKET = 'website-images';

const loginPanel = document.getElementById('login-panel');
const dashboardPanel = document.getElementById('dashboard-panel');
const loginForm = document.getElementById('login-form');
const imageFileInput = document.getElementById('image-file');
const uploadDropzone = document.getElementById('upload-dropzone');
const logoutButton = document.getElementById('logout-button');
const loginMessage = document.getElementById('login-message');
const dashboardMessage = document.getElementById('dashboard-message');
let isUploading = false;

const isConfigured = !SUPABASE_URL.startsWith('YOUR_') && !SUPABASE_ANON_KEY.startsWith('YOUR_');
const supabaseClient = isConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function showMessage(element, message, isError = true) {
    element.textContent = message;
    element.style.color = isError ? '#8b2f2f' : '#2d6a4f';
}

function showDashboard(isVisible) {
    loginPanel.classList.toggle('admin-hidden', isVisible);
    dashboardPanel.classList.toggle('admin-hidden', !isVisible);
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

async function uploadImages(files) {
    if (!supabaseClient || isUploading || files.length === 0) return;

    const images = files.filter(file => file.type.startsWith('image/'));
    const rejectedCount = files.length - images.length;

    if (images.length === 0) {
        showMessage(dashboardMessage, 'Please choose image files only.');
        imageFileInput.value = '';
        return;
    }

    isUploading = true;
    uploadDropzone.setAttribute('aria-disabled', 'true');
    uploadDropzone.classList.add('is-uploading');
    showMessage(dashboardMessage, `Uploading ${images.length} image${images.length === 1 ? '' : 's'}...`, false);

    const failedFiles = [];
    for (const [index, file] of images.entries()) {
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
        const filePath = `${Date.now()}-${index + 1}-${safeName}`;

        try {
            const { error } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

            if (error) failedFiles.push(`${file.name} (${error.message})`);
        } catch (error) {
            failedFiles.push(`${file.name} (${error.message || 'network error'})`);
        }
    }

    isUploading = false;
    uploadDropzone.removeAttribute('aria-disabled');
    uploadDropzone.classList.remove('is-uploading');
    imageFileInput.value = '';

    const uploadedCount = images.length - failedFiles.length;
    if (failedFiles.length > 0) {
        const skippedText = rejectedCount ? ` ${rejectedCount} non-image file(s) skipped.` : '';
        showMessage(dashboardMessage, `Uploaded ${uploadedCount}/${images.length}. Could not upload: ${failedFiles.join(', ')}.${skippedText}`);
    } else {
        const skippedText = rejectedCount ? ` ${rejectedCount} non-image file(s) skipped.` : '';
        showMessage(dashboardMessage, `Upload complete: ${uploadedCount} image${uploadedCount === 1 ? '' : 's'}.${skippedText}`, false);
    }
}

imageFileInput.addEventListener('change', () => {
    uploadImages(Array.from(imageFileInput.files));
});

uploadDropzone.addEventListener('dragover', event => {
    event.preventDefault();
    if (!isUploading) uploadDropzone.classList.add('drag-over');
});

uploadDropzone.addEventListener('dragleave', event => {
    if (!uploadDropzone.contains(event.relatedTarget)) {
        uploadDropzone.classList.remove('drag-over');
    }
});

uploadDropzone.addEventListener('drop', event => {
    event.preventDefault();
    uploadDropzone.classList.remove('drag-over');
    if (!isUploading) uploadImages(Array.from(event.dataTransfer.files));
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