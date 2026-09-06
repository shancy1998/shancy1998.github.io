const navToggle = document.querySelector('.nav-toggle');
const topbar = document.querySelector('.topbar');
const navLinks = document.querySelectorAll('.nav-links a');

if (document.getElementById('year')) {
    document.getElementById('year').textContent = new Date().getFullYear();
}

const serviceSelect = document.querySelector('select[name="service"]');
const requestedService = new URLSearchParams(window.location.search).get('service');

if (serviceSelect && requestedService) {
    const matchingOption = Array.from(serviceSelect.options).find(option => option.value === requestedService || option.text === requestedService);

    if (matchingOption) {
        serviceSelect.value = matchingOption.value;
    }
}

if (navToggle && topbar) {
    navToggle.addEventListener('click', () => {
        const isOpen = topbar.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (topbar) {
            topbar.classList.remove('open');
        }
        if (navToggle) {
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
});