// Admin Authentication Middleware
// Protects routes - requires user to be logged in AND have admin role

const requireAuth = require('./requireAuth');

const requireAdmin = (req, res, next) => {
    // First check if user is authenticated
    if (!req.session.userId) {
        // If the request expects HTML (e.g., browser navigation), redirect to login
        if (req.accepts('html')) {
            return res.redirect('/login');
        }
        // Otherwise, return JSON error
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required'
        });
    }

    // Then check if user has admin role
    if (req.session.role !== 'admin') {
        // For access denied, we can redirect to dashboard or return 403
        // Requirement: non-admin users must receive 403 or be redirected to /dashboard.
        // We'll choose to redirect to /dashboard for HTML requests, and JSON for API.
        if (req.accepts('html')) {
            return res.redirect('/dashboard');
        }
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required'
        });
    }

    // User is authenticated and is admin, proceed to next middleware/route handler
    next();
};

module.exports = requireAdmin;