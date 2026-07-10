const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const quizRoutes = require('./api/quizzes');

// Home page route
router.get('/', homeController.index);

// About page route
router.get('/about', homeController.about);

// Contact page route
router.get('/contact', homeController.contact);

// API routes
router.use('/api/quizzes', quizRoutes);

module.exports = router;
