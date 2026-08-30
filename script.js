const navToggle = document.querySelector('.nav-toggle');
const topbar = document.querySelector('.topbar');
const navLinks = document.querySelectorAll('.nav-links a');

if (document.getElementById('year')) {
    document.getElementById('year').textContent = new Date().getFullYear();
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