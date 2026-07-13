const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set views directory
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Routes
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Quiz API is running',
        timestamp: new Date().toISOString()
    });
});

// Auth routes
const authRouter = require('./routes/api/auth');
app.use('/api/auth', authRouter);

// Admin routes
const adminRouter = require('./routes/api/admin');
app.use('/api/admin', adminRouter);

// Student management routes
const studentRouter = require('./routes/api/students');
app.use('/api/students', studentRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).sendFile(path.join(__dirname, 'views', '500.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

module.exports = app;
