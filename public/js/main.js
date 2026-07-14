// Main JavaScript for Online Quiz System
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded fired, main.js');
    // Initialize shared navbar on pages with data-nav attribute
    if (window.Navbar) {
        console.log('Initializing navbar');
        try {
            Navbar.initAll();
        } catch (e) {
            console.error('Error initializing navbar:', e);
        }
    } else {
        console.warn('window.Navbar not found');
    }

    // Active state for statically rendered nav links (pages without data-nav)
    const currentPath = window.location.pathname;
    document.querySelectorAll('.navbar .nav-links a').forEach(item => {
        const linkPath = new URL(item.href, window.location.origin).pathname;
        if (linkPath === currentPath) {
            item.classList.add('active');
        }
    });

    // Mobile menu for statically rendered navbars
    document.querySelectorAll('.navbar').forEach(navbar => {
        if (navbar.closest('[data-nav]')) return;

        const toggle = navbar.querySelector('.menu-toggle');
        const navLinks = navbar.querySelector('.nav-links');
        if (!toggle || !navLinks) return;

        toggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Form validation
    document.querySelectorAll('form.validate').forEach(form => {
        form.addEventListener('submit', function (e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
    });

    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

        inputs.forEach(input => {
            input.classList.remove('is-invalid');
            const errorDiv = input.parentElement.querySelector('.invalid-feedback');
            if (errorDiv) errorDiv.remove();

            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('is-invalid');

                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = 'This field is required';
                input.parentElement.appendChild(feedback);
            }
        });

        return isValid;
    }

    // API helper functions
    window.api = {
        get: async (url) => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        },
        post: async (url, data) => {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        }
    };

    // Health check button (legacy support)
    const healthCheckBtn = document.getElementById('health-check-btn');
    if (healthCheckBtn) {
        healthCheckBtn.addEventListener('click', async () => {
            const resultDiv = document.getElementById('health-check-result');
            if (!resultDiv) return;

            resultDiv.innerHTML = '<p class="loading-message">Checking API...</p>';
            try {
                const data = await api.get('/api/health');
                resultDiv.innerHTML = `
                    <h3>API Health Check</h3>
                    <p><strong>Status:</strong> ${data.status}</p>
                    <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                `;
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="alert alert-error">Health check failed: ${error.message}</div>
                `;
            }
        });
    }
});
