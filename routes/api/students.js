// Admin Student API Routes
const express = require('express');
const router = express.Router();
const db = require('../../config/db');

// GET /api/students - Get all students with search and pagination
router.get('/', async (req, res) => {
    // Check if user is admin
    if (!req.session.userId || req.session.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required'
        });
    }

    try {
        const { search = '', page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        // Build search condition
        let whereClause = 'WHERE u.role = ?';
        const params = ['student'];

        if (search.trim() !== '') {
            whereClause += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Get students with stats
        const [students] = await db.promisePool.query(`
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.created_at as registration_date,
                COUNT(qa.id) as total_quizzes_attempted,
                COALESCE(AVG(qa.score), 0) as average_score
            FROM users u
            LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
            ${whereClause}
            GROUP BY u.id, u.full_name, u.email, u.created_at
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limitNum, offset]);

        // Get total count for pagination
        const [countResult] = await db.promisePool.query(`
            SELECT COUNT(*) as total
            FROM users u
            ${whereClause}
        `, params);

        const total = countResult[0].total;

        res.status(200).json({
            status: 'success',
            data: {
                students: students.map(student => ({
                    id: student.id,
                    full_name: student.full_name,
                    email: student.email,
                    registration_date: student.registration_date,
                    total_quizzes_attempted: student.total_quizzes_attempted,
                    average_score: parseFloat(student.average_score || 0)
                })),
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                    hasNext: (pageNum * limitNum) < total,
                    hasPrev: pageNum > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch students'
        });
    }
});

// GET /api/students/:id - Get student profile
router.get('/:id', async (req, res) => {
    // Check if user is admin
    if (!req.session.userId || req.session.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required'
        });
    }

    try {
        const studentId = parseInt(req.params.id);
        if (isNaN(studentId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid student ID'
            });
        }

        // Get student info
        const [studentRows] = await db.promisePool.query(`
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.created_at as registration_date
            FROM users u
            WHERE u.id = ? AND u.role = 'student'
        `, [studentId]);

        if (studentRows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Student not found'
            });
        }

        const student = studentRows[0];

        // Get student stats
        const [statsRows] = await db.promisePool.query(`
            SELECT
                COUNT(qa.id) as total_quizzes_attempted,
                COALESCE(AVG(qa.score), 0) as average_score
            FROM quiz_attempts qa
            WHERE qa.user_id = ?
        `, [studentId]);

        // Get recent attempts (last 5)
        const [recentAttempts] = await db.promisePool.query(`
            SELECT
                qa.id,
                qa.score,
                qa.percentage,
                qa.submitted_at as date,
                q.title as quiz_title
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.user_id = ?
            ORDER BY qa.submitted_at DESC
            LIMIT 5
        `, [studentId]);

        res.status(200).json({
            status: 'success',
            data: {
                id: student.id,
                full_name: student.full_name,
                email: student.email,
                registration_date: student.regisration_date,
                total_quizzes_attempted: statsRows[0].total_quizzes_attempted,
                average_score: parseFloat(statsRows[0].average_score || 0),
                recent_attempts: recentAttempts.map(attempt => ({
                    id: attempt.id,
                    quiz_title: attempt.quiz_title,
                    score: attempt.score,
                    percentage: attempt.percentage,
                    date: new Date(attempt.date).toISOString().split('T')[0] // YYYY-MM-DD format
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch student profile'
        });
    }
});

// GET /api/students/:id/attempts - Get all attempts for a student
router.get('/:id/attempts', async (req, res) => {
    // Check if user is admin
    if (!req.session.userId || req.session.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required'
        });
    }

    try {
        const studentId = parseInt(req.params.id);
        if (isNaN(studentId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid student ID'
            });
        }

        // Verify student exists
        const [studentRows] = await db.promisePool.query(`
            SELECT id FROM users WHERE id = ? AND role = 'student'
        `, [studentId]);

        if (studentRows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Student not found'
            });
        }

        // Get all attempts for this student
        const [attempts] = await db.promisePool.query(`
            SELECT
                qa.id,
                qa.score,
                qa.percentage,
                qa.submitted_at as date,
                q.title as quiz_title
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.user_id = ?
            ORDER BY qa.submitted_at DESC
        `, [studentId]);

        res.status(200).json({
            status: 'success',
            data: {
                attempts: attempts.map(attempt => ({
                    id: attempt.id,
                    quiz_title: attempt.quiz_title,
                    score: attempt.score,
                    percentage: attempt.percentage,
                    date: new Date(attempt.date).toISOString()
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching student attempts:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch student attempts'
        });
    }
});

module.exports = router;