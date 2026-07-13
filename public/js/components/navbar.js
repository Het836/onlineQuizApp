/**
 * Shared navbar component
 * Renders guest or authenticated navigation and wires mobile menu + logout.
 */
window.Navbar = (function () {
    const GUEST_LINKS = [
        { href: '/', label: 'Home', key: 'home' },
        { href: '/login', label: 'Login', key: 'login' },
        { href: '/register', label: 'Register', key: 'register' }
    ];

    const AUTH_LINKS = [
        { href: '/dashboard', label: 'Dashboard', key: 'dashboard' },
        { href: '/results', label: 'Results', key: 'results' },
        { href: '/profile', label: 'Profile', key: 'profile' },
        { href: '#', label: 'Logout', key: 'logout', id: 'logout-link' }
    ];

    const ADMIN_LINKS = [
        { href: '/admin/dashboard', label: 'Dashboard', key: 'dashboard' },
        { href: '/admin/students', label: 'Manage Students', key: 'students' },
        { href: '/admin/quizzes', label: 'Manage Quizzes', key: 'quizzes' },
        { href: '#', label: 'Logout', key: 'logout', id: 'logout-link' }
    ];

    function renderLink(link, activeKey) {
        const active = link.key === activeKey ? ' class="active"' : '';
        const id = link.id ? ` id="${link.id}"` : '';
        return `<li><a href="${link.href}"${id}${active}>${link.label}</a></li>`;
    }

    function render(type, activeKey) {
        const links = type === 'auth' ? AUTH_LINKS : GUEST_LINKS;
        const linkItems = links.map(link => renderLink(link, activeKey)).join('');

        return `
            <nav class="navbar">
                <div class="navbar-inner container">
                    <a href="/" class="logo">Online Quiz System</a>
                    <button class="menu-toggle" aria-label="Toggle menu" aria-expanded="false">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    <ul class="nav-links">
                        ${linkItems}
                    </ul>
                </div>
            </nav>
        `;
    }

    function initMobileMenu(navbarEl) {
        const toggle = navbarEl.querySelector('.menu-toggle');
        const navLinks = navbarEl.querySelector('.nav-links');

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
    }

    async function logout() {
        try {
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/';
                return;
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        window.location.href = '/login';
    }

    function initLogout(navbarEl) {
        const logoutLink = navbarEl.querySelector('#logout-link');
        if (!logoutLink) return;

        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    async function enhanceAdminNavbar(navbarEl) {
        try {
            const resp = await fetch('/api/auth/me');
            if (!resp.ok) return; // not authenticated, keep as is
            const data = await resp.json();
            const role = data.data?.role;
            if (role === 'admin') {
                const navLinks = navbarEl.querySelector('.nav-links');
                if (!navLinks) return;
                const activeKey = navbarEl.dataset.active || '';
                navLinks.innerHTML = ADMIN_LINKS.map(link => renderLink(link, activeKey)).join('');
                // Re-init mobile menu and logout listeners
                initMobileMenu(navbarEl);
                initLogout(navbarEl);
            }
        } catch (e) {
            console.warn('Could not enhance navbar for admin:', e);
        }
    }

    function mount(target, options = {}) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) return;

        const type = options.type || el.dataset.nav || 'guest';
        const activeKey = options.active || el.dataset.active || '';

        el.innerHTML = render(type, activeKey);

        const navbarEl = el.querySelector('.navbar') || el;
        initMobileMenu(navbarEl);

        if (type === 'auth') {
            initLogout(navbarEl);
            // Attempt to enhance to admin links if user is admin
            enhanceAdminNavbar(navbarEl);
        }
    }

    function initAll() {
        document.querySelectorAll('[data-nav]').forEach(el => mount(el));
    }

    return { render, mount, initAll, logout };
})();