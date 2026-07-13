const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const quizRoutes = require('./api/quizzes');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// Home page route
router.get('/', homeController.index);

// About page route
router.get('/about', homeController.about);

// Contact page route
router.get('/contact', homeController.contact);

// Authentication routes
router.get('/login', homeController.login);
router.get('/register', homeController.register);

// Dashboard and results routes
router.get('/dashboard', homeController.dashboard);
router.get('/results', homeController.results);
router.get('/results/:id', homeController.resultDetails);

// Quiz page route
router.get('/quiz.html', homeController.quiz);

// Admin dashboard route (protected)
router.get('/admin/dashboard', requireAuth, requireAdmin, (req, res) => {
    res.render('admin/dashboard');
});

// Admin student routes (protected)
router.get('/admin/students', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        res.render('admin/students/index');
    } catch (error) {
        next(error);
    }
});

router.get('/admin/students/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        res.render('admin/students/show');
    } catch (error) {
        next(error);
    }
});

router.get('/admin/students/:id/attempts', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        res.render('admin/students/attempts');
    } catch (error) {
        next(error);
    }
});

// Placeholder for other admin routes (protected)
router.get('/admin/*', requireAuth, requireAdmin, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Under Construction - Online Quiz System</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="/css/style.css">
            <style>
                .container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
                .card { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 2rem; }
            </style>
        </head>
        <body>
            <div id="navbar" data-nav="guest" data-active="dashboard"></div>
            <main id="main-content" class="container page">
                <section class="dashboard">
                    <div class="card">
                        <h1>Under Construction</h1>
                        <p>This feature is coming soon.</p>
                        <a href="/admin/dashboard" class="btn btn-primary">← Back to Dashboard</a>
                    </div>
                </section>
            </main>
            <footer>
                <div class="container">
                    <p>&copy; 2026 Online Quiz System. All rights reserved.</p>
                </div>
            </footer>
            <script src="/js/components/navbar.js"></script>
            <script src="/js/main.js"></script>
        </body>
        </html>
    `);
});

// API routes
router.use('/api/quizzes', quizRoutes);

module.exports = router;