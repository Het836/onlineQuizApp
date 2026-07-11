// Authentication Middleware
// Protects routes - requires user to be logged in

const requireAuth = (req, res, next) => {
    // Check if user is authenticated via session
    if (!req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required'
        });
    }

    // User is authenticated, proceed to next middleware/route handler
    next();
};

module.exports = requireAuth;