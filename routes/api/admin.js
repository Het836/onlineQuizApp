// Admin API Routes
const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const Quiz = require('../../Models/Quiz.js');
const Question = require('../../Models/Question.js');
const Option = require('../../Models/Option.js');
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

// Validate questions and options
const validateQuizQuestions = (quizData) => {
  const errors = [];
  if (!quizData.questions || !Array.isArray(quizData.questions)) {
    errors.push('Questions must be an array');
    return errors;
  }
  if (quizData.questions.length === 0) {
    errors.push('Quiz must have at least one question');
    return errors;
  }
  for (let qIndex = 0; qIndex < quizData.questions.length; qIndex++) {
    const q = quizData.questions[qIndex];
    if (!q.question_text || typeof q.question_text !== 'string' || q.question_text.trim() === '') {
      errors.push(`Question ${qIndex + 1}: Text is required`);
      break;
    }
    if (!q.options || !Array.isArray(q.options)) {
      errors.push(`Question ${qIndex + 1}: Options must be an array`);
      break;
    }
    if (q.options.length < 2) {
      errors.push(`Question ${qIndex + 1}: Must have at least 2 options`);
      break;
    }
    let correctCount = 0;
    for (let oIndex = 0; oIndex < q.options.length; oIndex++) {
      const opt = q.options[oIndex];
      if (!opt.option_text || typeof opt.option_text !== 'string' || opt.option_text.trim() === '') {
        errors.push(`Question ${qIndex + 1}, Option ${String.fromCharCode(65 + oIndex)}: Text is required`);
        break;
      }
      if (opt.is_correct) {
        correctCount++;
      }
    }
    if (correctCount !== 1) {
      errors.push(`Question ${qIndex + 1}: Must have exactly one correct option`);
      break;
    }
  }
  return errors;
};

// Apply auth and admin middleware to all routes in this router
router.use(requireAuth);
router.use(requireAdmin);

// GET /admin/dashboard - Get admin dashboard statistics
router.get('/dashboard', async (req, res) => {
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

// GET /admin/quizzes - Get all quizzes (for admin list)
router.get('/quizzes', async (req, res) => {
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
router.get('/quizzes/:id', async (req, res) => {
    try {
        const quizId = parseInt(req.params.id);
        if (isNaN(quizId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid quiz ID'
            });
        }

        const quiz = await Quiz.findByIdWithQuestions(quizId, true);
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

// POST /admin/quizzes - Create a new quiz with questions and options
router.post('/quizzes', async (req, res) => {
    try {
        const quizData = req.body;

        // Validate basic fields
        const basicErrors = validateQuiz(quizData);
        // Validate questions and options
        const questionErrors = validateQuizQuestions(quizData);
        const allErrors = [...basicErrors, ...questionErrors];
        if (allErrors.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: allErrors
            });
        }

        // Create quiz
        const quiz = await Quiz.create(quizData);
        const quizId = quiz.id;

        // Create questions and options if provided
        if (quizData.questions && Array.isArray(quizData.questions)) {
            for (const qData of quizData.questions) {
                const question = await Question.create({
                    quiz_id: quizId,
                    question_text: qData.question_text
                });
                const questionId = question.id;

                if (qData.options && Array.isArray(qData.options)) {
                    for (const optData of qData.options) {
                        await Option.create({
                            question_id: questionId,
                            option_text: optData.option_text,
                            is_correct: optData.is_correct ? 1 : 0
                        });
                    }
                }
            }
        }

        // Fetch the created quiz with questions and options to return
        const createdQuiz = await Quiz.findByIdWithQuestions(quizId, true);

        res.status(201).json({
            status: 'success',
            message: 'Quiz created successfully',
            data: createdQuiz
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
router.put('/quizzes/:id', async (req, res) => {
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

// PUT /admin/quizzes/:id/toggle - Toggle quiz active status
router.put('/quizzes/:id/toggle', async (req, res) => {
    try {
        const quizId = parseInt(req.params.id);
        if (isNaN(quizId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid quiz ID'
            });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                status: 'error',
                message: 'Quiz not found'
            });
        }

        const updated = await Quiz.update(quizId, {
            title: quiz.title,
            description: quiz.description,
            duration_minutes: quiz.duration_minutes,
            is_active: !quiz.is_active
        });
        if (!updated) {
            return res.status(400).json({
                status: 'error',
                message: 'Failed to toggle quiz status'
            });
        }

        res.status(200).json({
            status: 'success',
            message: quiz.is_active ? 'Quiz deactivated' : 'Quiz activated',
            data: { id: quizId, is_active: !quiz.is_active }
        });
    } catch (error) {
        console.error('Error toggling quiz:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to toggle quiz'
        });
    }
});

// DELETE /admin/quizzes/:id - Delete a quiz (or deactivate if attempts exist)
router.delete('/quizzes/:id', async (req, res) => {
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