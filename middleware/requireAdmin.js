// Admin Authentication Middleware
// Protects routes - requires user to be logged in AND have admin role

const requireAuth = require('./requireAuth');

const requireAdmin = (req, res, next) => {
    // First check if user is authenticated
    if (!req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required'
        });
    }

    // Then check if user has admin role
    if (req.session.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required'
        });
    }

    // User is authenticated and is admin, proceed to next middleware/route handler
    next();
};

module.exports = requireAdmin;