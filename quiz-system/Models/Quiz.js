// Quiz Model
const db = require('../config/db');

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