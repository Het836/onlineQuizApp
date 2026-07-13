// Quiz Model
const db = require('../config/db');
const Question = require('./Question.js');
const Option = require('./Option.js');

class Quiz {
  // Create a new quiz
  static async create(quizData) {
    const { title, description, duration_minutes, is_active } = quizData;
    const [result] = await db.promisePool.query(
      'INSERT INTO quizzes (title, description, duration_minutes, is_active) VALUES (?, ?, ?, ?)',
      [title, description, duration_minutes, is_active]
    );
    return { id: result.insertId, ...quizData };
  }

  // Find quiz by ID
  static async findById(id) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM quizzes WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Find quiz by ID with questions and options.
  // If includeAnswers is true, includes the is_correct flag in options.
  static async findByIdWithQuestions(id, includeAnswers = false) {
    try {
      // Get the quiz
      const quiz = await this.findById(id);
      if (!quiz) {
        return null;
      }

      // Get all questions for this quiz
      const questions = await Question.findByQuizId(id);

      // For each question, get its options
      for (let i = 0; i < questions.length; i++) {
        const options = await Option.findByQuestionId(questions[i].id);
        if (includeAnswers) {
          // Keep is_correct field
          questions[i].options = options;
        } else {
          // Remove the is_correct field before sending to frontend
          questions[i].options = options.map(option => {
            const { is_correct, ...optionWithoutCorrect } = option;
            return optionWithoutCorrect;
          });
        }
      }

      // Attach questions to quiz
      quiz.questions = questions;

      return quiz;
    } catch (error) {
      throw error;
    }
  }

  // Get all quizzes
  static async findAll() {
    const [rows] = await db.promisePool.query('SELECT * FROM quizzes');
    return rows;
  }

  // Get active quizzes
  static async findActive() {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM quizzes WHERE is_active = TRUE'
    );
    return rows;
  }

  // Update quiz
  static async update(id, quizData) {
    const { title, description, duration_minutes, is_active } = quizData;
    const [result] = await db.promisePool.query(
      'UPDATE quizzes SET title = ?, description = ?, duration_minutes = ?, is_active = ? WHERE id = ?',
      [title, description, duration_minutes, is_active, id]
    );
    return result.affectedRows > 0;
  }

  // Delete quiz
  static async delete(id) {
    const [result] = await db.promisePool.query(
      'DELETE FROM quizzes WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Quiz;