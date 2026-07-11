/**
 * Home Controller
 * Handles routes for the homepage and basic views
 */

const path = require('path');

/**
 * GET /
 * Render the homepage
 */
exports.index = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
};

/**
 * GET /about
 * Render the about page
 */
exports.about = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'about.html'));
};

/**
 * GET /contact
 * Render the contact page
 */
exports.contact = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'contact.html'));
};

/**
 * GET /quiz.html
 * Render the quiz page
 */
exports.quiz = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'quiz.html'));
};

/**
 * GET /login
 * Render the login page
 */
exports.login = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
};

/**
 * GET /register
 * Render the registration page
 */
exports.register = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'register.html'));
};

/**
 * GET /dashboard
 * Render the dashboard page
 */
exports.dashboard = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));
};

/**
 * GET /results
 * Render the results page
 */
exports.results = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'results.html'));
};

/**
 * GET /results/:id
 * Render the result details page
 */
exports.resultDetails = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'result-details.html'));
};