/**
 * Global Error Handling Middleware
 * Handles errors that occur in the application
 */

/**
 * Not Found Middleware
 * Handles 404 errors
 */
exports.notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Error Handler Middleware
 * Handles all other errors
 */
exports.errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
};
