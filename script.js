const navToggle = document.querySelector('.nav-toggle');
const topbar = document.querySelector('.topbar');
const navLinks = document.querySelectorAll('.nav-links a');
const managedImageCards = document.querySelectorAll('[data-admin-image]');

function loadManagedImage(card) {
    const imageKey = card.dataset.adminImage;
    const imageUrl = `https://bgcsmwrqkujkgmujobxn.supabase.co/storage/v1/object/public/website-images/homepage/${imageKey}?v=${Date.now()}`;
    const imageTest = new Image();

    imageTest.onload = () => {
        const serviceImage = card.querySelector('.service-image');
        if (serviceImage) {
            serviceImage.src = imageUrl;
        } else {
            card.style.backgroundImage = `linear-gradient(135deg, rgba(6, 14, 24, 0.78), rgba(15, 27, 39, 0.5)), url("${imageUrl}")`;
        }
    };

    imageTest.src = imageUrl;
}

if ('IntersectionObserver' in window) {
    const managedImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadManagedImage(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });

    managedImageCards.forEach(card => managedImageObserver.observe(card));
} else {
    managedImageCards.forEach(loadManagedImage);
}

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