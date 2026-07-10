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
