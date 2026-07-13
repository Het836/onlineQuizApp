// Auth API Routes
const express = require('express');
const router = express.Router();
const User = require('../../Models/User.js');
const bcrypt = require('bcrypt');
const db = require('../../config/db');

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, password, role = 'student' } = req.body;

        // Validate input
        if (!full_name || !email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Full name, email, and password are required'
            });
        }

        // Validate role
        if (role !== 'admin' && role !== 'student') {
            return res.status(400).json({
                status: 'error',
                message: 'Role must be either "admin" or "student"'
            });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const userData = {
            full_name,
            email,
            password: passwordHash,
            role
        };

        const user = await User.create(userData);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to register user'
        });
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Create session
        req.session.userId = user.id;
        req.session.role = user.role;

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to login user'
        });
    }
});

// POST /api/auth/logout - Logout user
router.post('/logout', (req, res) => {
    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to logout'
            });
        }

        // Clear session cookie
        res.clearCookie('connect.sid');

        res.status(200).json({
            status: 'success',
            message: 'Logout successful'
        });
    });
});

// GET /api/auth/me - Get current user info with stats
router.get('/me', async (req, res) => {
    try {
                if (!req.session.userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Not authenticated'
            });
        }
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found'
            });
        }
        // Get stats
        const [stats] = await db.promisePool.query(
            `SELECT
                COUNT(*) as total_attempts,
                AVG(score) as average_score,
                MAX(score) as highest_score
            FROM quiz_attempts
            WHERE user_id = ?`,
            [user.id]
        );
        const [recent] = await db.promisePool.query(
            `SELECT qa.id, qa.score, qa.percentage, q.title as quiz_title, qa.submitted_at as date
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.user_id = ?
            ORDER BY qa.submitted_at DESC
            LIMIT 5`,
            [user.id]
        );
        const totalAttempts = stats[0]?.total_attempts || 0;
        // const averageScore = parseFloat((stats[0]?.average_score || 0).toFixed(2));
        const averageScore = Number(parseFloat(stats[0]?.average_score || 0).toFixed(2));
        const highestScore = stats[0]?.highest_score || 0;
        const recentAttempts = recent.map(a => ({
            id: a.id,
            quiz_title: a.quiz_title,
            score: a.score,
            // percentage: a.percentage ? parseFloat(a.percentage.toFixed(2)) : 0,
            percentage: parseFloat(a.percentage || 0),
            date: a.date ? new Date(a.date).toLocaleDateString() : ''
        }));
                const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({
            status: 'success',
            data: {
                ...userWithoutPassword,
                total_quizzes_attempted: totalAttempts,
                average_score: averageScore,
                highest_score: highestScore,
                recent_attempts: recentAttempts
            }
        });
    } catch (error) {
        console.error('[ERROR] /me error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user information',
            error: error.message // debug only
        });
    }
});

// PUT /api/auth/me - Update current user's name and email
router.put('/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Not authenticated'
            });
        }
        const { full_name, email } = req.body;
        // Basic validation
        if (!full_name || !full_name.trim() || !email || !email.trim()) {
            return res.status(400).json({
                status: 'error',
                message: 'Name and email are required'
            });
        }
        // Optionally validate email format (simple)
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.trim())) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format'
            });
        }
        // Update user
        const [result] = await db.promisePool.query(
            `UPDATE users SET full_name = ?, email = ? WHERE id = ?`,
            [full_name.trim(), email.trim(), req.session.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'User not found or no changes'
            });
        }
        // Fetch updated user (without password)
        const updatedUser = await User.findById(req.session.userId);
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.status(200).json({
            status: 'success',
            message: 'Profile updated',
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update profile'
        });
    }
});

module.exports = router;