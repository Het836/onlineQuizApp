// Quiz API Routes
const express = require('express');
const router = express.Router();
const Quiz = require('../../Models/Quiz.js');

// Validation functions
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

// GET /api/quizzes - Get all quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.findAll();
    res.status(200).json({
      status: 'success',
      data: quizzes
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch quizzes'
    });
  }
});

// GET /api/quizzes/:id - Get a specific quiz with questions and options
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

// POST /api/quizzes - Create a new quiz
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

    const newQuiz = await Quiz.create(quizData);
    res.status(201).json({
      status: 'success',
      message: 'Quiz created successfully',
      data: newQuiz
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create quiz'
    });
  }
});

// PUT /api/quizzes/:id - Update a quiz
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

    const updatedQuiz = await Quiz.update(quizId, quizData);
    if (!updatedQuiz) {
      return res.status(500).json({
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

// DELETE /api/quizzes/:id - Delete a quiz
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

    const deleted = await Quiz.delete(quizId);
    if (!deleted) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete quiz'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete quiz'
    });
  }
});

module.exports = router;