// Admin API Routes
const express = require('express');
const router = express.Router();
const db = require('../../config/db');

// GET /api/admin/dashboard - Get admin dashboard statistics
router.get('/dashboard', async (req, res) => {
    // Check if user is authenticated and is admin (should be handled by middleware, but double-check)
    if (!req.session.userId || req.session.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required'
        });
    }

    try {
        // Get total students (users with role='student')
        const [studentRows] = await db.promisePool.query(
            'SELECT COUNT(*) as count FROM users WHERE role = ?',
            ['student']
        );
        const totalStudents = studentRows[0].count;

        // Get total quizzes
        const [quizRows] = await db.promisePool.query(
            'SELECT COUNT(*) as count FROM quizzes'
        );
        const totalQuizzes = quizRows[0].count;

        // Get total quiz attempts
        const [attemptRows] = await db.promisePool.query(
            'SELECT COUNT(*) as count FROM quiz_attempts'
        );
        const totalAttempts = attemptRows[0].count;

        // Get average score (as percentage)
        const [scoreRows] = await db.promisePool.query(
            'SELECT AVG(score) as avg_score FROM quiz_attempts'
        );
        // Assuming score is stored as a percentage (0-100) or we need to calculate
        // If score is raw points, we might need to adjust. For now, assume it's percentage.
        const averageScore = scoreRows[0].avg_score ? parseFloat(scoreRows[0].avg_score).toFixed(2) : 0;

        // Get recent attempts (last 5) with student name and quiz title
        const [recentRows] = await db.promisePool.query(`
            SELECT
                qa.id,
                u.full_name as student_name,
                q.title as quiz_title,
                qa.score,
                qa.created_at
            FROM quiz_attempts qa
            JOIN users u ON qa.user_id = u.id
            JOIN quizzes q ON qa.quiz_id = q.id
            ORDER BY qa.created_at DESC
            LIMIT 5
        `);

        // Format recent attempts for frontend
        const recentAttempts = recentRows.map(attempt => ({
            id: attempt.id,
            student_name: attempt.student_name,
            quiz_title: attempt.quiz_title,
            score: attempt.score,
            // Assuming score is a percentage, if not, adjust accordingly
            percentage: parseFloat(attempt.score).toFixed(2) + '%',
            date: new Date(attempt.created_at).toLocaleDateString()
        }));

        res.status(200).json({
            status: 'success',
            data: {
                totalStudents,
                totalQuizzes,
                totalAttempts,
                averageScore: parseFloat(averageScore),
                recentAttempts
            }
        });
    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch dashboard data'
        });
    }
});

module.exports = router;