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
        Array.from(serviceSelect.options).forEach(option => {
            option.hidden = option !== matchingOption;
        });
        document.body.classList.add(`quote-category-${matchingOption.value.toLowerCase().replaceAll(' ', '-')}`);

        const quoteHeading = document.querySelector('.quote-copy h1');
        const quoteIntro = document.querySelector('.quote-intro');

        if (quoteHeading) {
            quoteHeading.textContent = `${matchingOption.text} quote request`;
        }

        if (quoteIntro) {
            quoteIntro.textContent = `Tell us about your ${matchingOption.text.toLowerCase()} requirement. Our team will recommend the right solution for your property and budget.`;
        }
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