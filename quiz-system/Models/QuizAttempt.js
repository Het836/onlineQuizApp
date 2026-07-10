// QuizAttempt Model
const db = require('../config/db');

class QuizAttempt {
  // Create a new quiz attempt
  static async create(attemptData) {
    const { user_id, quiz_id } = attemptData;
    const [result] = await db.promisePool.query(
      'INSERT INTO quiz_attempts (user_id, quiz_id) VALUES (?, ?)',
      [user_id, quiz_id]
    );
    return { id: result.insertId, ...attemptData, score: 0.00 };
  }

  // Find attempt by ID
  static async findById(id) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM quiz_attempts WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Get attempts by user ID
  static async findByUserId(userId) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM quiz_attempts WHERE user_id = ?',
      [userId]
    );
    return rows;
  }

  // Get attempts by quiz ID
  static async findByQuizId(quizId) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM quiz_attempts WHERE quiz_id = ?',
      [quizId]
    );
    return rows;
  }

  // Update attempt (submit score)
  static async update(id, attemptData) {
    const { score, submitted_at } = attemptData;
    const [result] = await db.promisePool.query(
      'UPDATE quiz_attempts SET score = ?, submitted_at = ? WHERE id = ?',
      [score, submitted_at, id]
    );
    return result.affectedRows > 0;
  }

  // Delete attempt
  static async delete(id) {
    const [result] = await db.promisePool.query(
      'DELETE FROM quiz_attempts WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = QuizAttempt;