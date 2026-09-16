const SUPABASE_URL = 'https://bgcsmwrqkujkgmujobxn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KtJzFbC82YvllhlQAEgrvA_xuTDJmHK';
const STORAGE_BUCKET = 'website-images';

const loginPanel = document.getElementById('login-panel');
const dashboardPanel = document.getElementById('dashboard-panel');
const loginForm = document.getElementById('login-form');
const uploadForm = document.getElementById('upload-form');
const logoutButton = document.getElementById('logout-button');
const loginMessage = document.getElementById('login-message');
const dashboardMessage = document.getElementById('dashboard-message');
const imageGallery = document.getElementById('image-gallery');

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

async function loadImages() {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .list('', {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
        });

    if (error) {
        showMessage(dashboardMessage, error.message);
        return;
    }

    imageGallery.replaceChildren();

    data.filter(file => file.name).forEach(file => {
        const { data: publicData } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(file.name);

        const card = document.createElement('article');
        card.className = 'admin-image';

        card.innerHTML = `
            <img src="${publicData.publicUrl}" alt="${file.name}">
            <div class="admin-image-body">
                <span class="admin-image-name" title="${file.name}">${file.name}</span>
                <button class="cta secondary delete-image" type="button" data-name="${file.name}">
                    Delete
                </button>
            </div>
        `;

        imageGallery.appendChild(card);
    });
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
    await loadImages();
});

uploadForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (!supabaseClient) return;

    const file = document.getElementById('image-file').files[0];
    if (!file) return;

    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const filePath = `${Date.now()}-${safeName}`;

    const { error } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
    });

    if (error) {
        showMessage(dashboardMessage, error.message);
        return;
    }

    uploadForm.reset();
    showMessage(dashboardMessage, 'Image uploaded successfully.', false);
    await loadImages();
});

imageGallery.addEventListener('click', async event => {
    const button = event.target.closest('.delete-image');
    if (!button || !supabaseClient) return;

    const { error } = await supabaseClient.storage.from(STORAGE_BUCKET).remove([button.dataset.name]);

    if (error) {
        showMessage(dashboardMessage, error.message);
        return;
    }

    showMessage(dashboardMessage, 'Image deleted successfully.', false);
    await loadImages();
});

logoutButton.addEventListener('click', async () => {
    if (!supabaseClient) return;

    await supabaseClient.auth.signOut();
    showDashboard(false);
    showMessage(loginMessage, 'You have been logged out.', false);
});

if (supabaseClient) {
    supabaseClient.auth.getSession().then(({ data }) => {
        if (data.session) {
            showDashboard(true);
            loadImages();
        }
    });
}