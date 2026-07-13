// Question Model
const db = require('../config/db');

class Question {
  // Create a new question
  static async create(questionData) {
    const { quiz_id, question_text } = questionData;
    const marks = questionData.marks ?? 1;
    const [result] = await db.promisePool.query(
      'INSERT INTO questions (quiz_id, question_text, marks) VALUES (?, ?, ?)',
      [quiz_id, question_text, marks]
    );
    return { id: result.insertId, quiz_id, question_text, marks };
  }

  // Find question by ID
  static async findById(id) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM questions WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Get all questions for a quiz
  static async findByQuizId(quizId) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM questions WHERE quiz_id = ?',
      [quizId]
    );
    return rows;
  }

  // Update question
  static async update(id, questionData) {
    const { quiz_id, question_text, marks } = questionData;
    const [result] = await db.promisePool.query(
      'UPDATE questions SET quiz_id = ?, question_text = ?, marks = ? WHERE id = ?',
      [quiz_id, question_text, marks, id]
    );
    return result.affectedRows > 0;
  }

  // Delete question
  static async delete(id) {
    const [result] = await db.promisePool.query(
      'DELETE FROM questions WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Question;