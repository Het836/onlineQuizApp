// Admin Quiz Routes
const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const Quiz = require('../../Models/Quiz.js');
const requireAuth = require('../../middleware/requireAuth');
const requireAdmin = require('../../middleware/requireAdmin');

// Validation functions (same as in quizzes.js)
const validateQuiz = (quiz) => {
  const errors = [];

  if (!quiz.title || quiz.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!quiz.description || quiz.description.trim() === '') {
    errors.push('Description is required');
  }

  if (!quiz.duration_minutes || isNaN(quiz.duration_minutes) || quiz.duration_minutes <= 0) {
    errors.push('Duration must be a positive number');
  }

  return errors;
};

// Apply auth and admin middleware to all routes in this router
router.use(requireAuth);
router.use(requireAdmin);

// GET /admin/quizzes - Get all quizzes (for admin list)
router.get('/', async (req, res) => {
    try {
        const quizzes = await Quiz.findAll();
        // For each quiz, get question count and attempt count
        const quizzesWithCounts = await Promise.all(quizzes.map(async (quiz) => {
            const [questionCount] = await db.promisePool.query(
                'SELECT COUNT(*) as count FROM questions WHERE quiz_id = ?',
                [quiz.id]
            );
            const [attemptCount] = await db.promisePool.query(
                'SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_id = ?',
                [quiz.id]
            );
            return {
                ...quiz,
                total_questions: questionCount[0].count,
                total_attempts: attemptCount[0].count
            };
        }));

        res.status(200).json({
            status: 'success',
            data: quizzesWithCounts
        });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch quizzes'
        });
    }
});

// GET /admin/quizzes/:id - Get a specific quiz with questions and options (for admin view/edit)
router.get('/:id', async (req, res) => {
    try {
        const quizId = parseInt(req.params.id);
        if (isNaN(quizId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid quiz ID'
            });
        }

        const quiz = await Quiz.findByIdWithQuestions(quizId);
        if (!quiz) {
            return res.status(404).json({
                status: 'error',
                message: 'Quiz not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: quiz
        });
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch quiz'
        });
    }
});

// POST /admin/quizzes - Create a new quiz
router.post('/', async (req, res) => {
    try {
        const quizData = req.body;

        // Validate input
        const validationErrors = validateQuiz(quizData);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Create quiz
        const quiz = await Quiz.create(quizData);
        res.status(201).json({
            status: 'success',
            message: 'Quiz created successfully',
            data: quiz
        });
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create quiz'
        });
    }
});

// PUT /admin/quizzes/:id - Update a quiz
router.put('/:id', async (req, res) => {
    try {
        const quizId = parseInt(req.params.id);
        if (isNaN(quizId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid quiz ID'
            });
        }

        const quizData = req.body;

        // Validate input
        const validationErrors = validateQuiz(quizData);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Check if quiz exists
        const existingQuiz = await Quiz.findById(quizId);
        if (!existingQuiz) {
            return res.status(404).json({
                status: 'error',
                message: 'Quiz not found'
            });
        }

        // Update quiz
        const updatedQuiz = await Quiz.update(quizId, quizData);
        if (!updatedQuiz) {
            return res.status(400).json({
                status: 'error',
                message: 'Failed to update quiz'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Quiz updated successfully',
            data: { id: quizId, ...quizData }
        });
    } catch (error) {
        console.error('Error updating quiz:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update quiz'
        });
    }
});

// DELETE /admin/quizzes/:id - Delete a quiz (or deactivate if attempts exist)
router.delete('/:id', async (req, res) => {
    try {
        const quizId = parseInt(req.params.id);
        if (isNaN(quizId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid quiz ID'
            });
        }

        // Check if quiz exists
        const existingQuiz = await Quiz.findById(quizId);
        if (!existingQuiz) {
            return res.status(404).json({
                status: 'error',
                message: 'Quiz not found'
            });
        }

        // Check if quiz has any attempts
        const [attemptCountRows] = await db.promisePool.query(
            'SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_id = ?',
            [quizId]
        );
        const attemptCount = attemptCountRows[0].count;

        if (attemptCount > 0) {
            // If attempts exist, we do not delete; instead we deactivate (set is_active = false)
            const [result] = await db.promisePool.query(
                'UPDATE quizzes SET is_active = FALSE WHERE id = ?',
                [quizId]
            );
            if (result.affectedRows > 0) {
                return res.status(200).json({
                    status: 'success',
                    message: 'Quiz has existing attempts and has been deactivated instead of deleted.',
                    data: { id: quizId, is_active: false }
                });
            } else {
                return res.status(400).json({
                    status: 'error',
                    message: 'Failed to deactivate quiz'
                });
            }
        } else {
            // No attempts, safe to delete
            const deleted = await Quiz.delete(quizId);
            if (!deleted) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Failed to delete quiz'
                });
            }

            res.status(200).json({
                status: 'success',
                message: 'Quiz deleted successfully'
            });
        }
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete quiz'
        });
    }
});

module.exports = router;