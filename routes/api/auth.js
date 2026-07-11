// Auth API Routes
const express = require('express');
const router = express.Router();
const User = require('../../Models/User.js');
const bcrypt = require('bcrypt');

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

// GET /api/auth/me - Get current user info
router.get('/me', (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Not authenticated'
        });
    }

    // Get user from database
    User.findById(req.session.userId)
        .then(user => {
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            res.status(200).json({
                status: 'success',
                data: userWithoutPassword
            });
        })
        .catch(error => {
            console.error('Error fetching user:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch user information'
            });
        });
});

module.exports = router;