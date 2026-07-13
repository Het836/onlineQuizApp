// Authentication Middleware
// Protects routes - requires user to be logged in

const requireAuth = (req, res, next) => {
    // Check if user is authenticated via session
    if (!req.session.userId) {
        // If the request expects HTML (e.g., browser navigation), redirect to login
        if (req.accepts('html')) {
            return res.redirect('/login');
        }
        // Otherwise, assume it's an API request and return JSON
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required'
        });
    }

    // User is authenticated, proceed to next middleware/route handler
    next();
};

module.exports = requireAuth;