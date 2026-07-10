// Option Model
const db = require('../config/db');

class Option {
  // Create a new option
  static async create(optionData) {
    const { question_id, option_text, is_correct } = optionData;
    const [result] = await db.promisePool.query(
      'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
      [question_id, option_text, is_correct]
    );
    return { id: result.insertId, ...optionData };
  }

  // Find option by ID
  static async findById(id) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM options WHERE id = ?',
      [id]
    );
    return rows[0return rows[0];
  }

  // Get all options for a question
  static async findByQuestionId(questionId) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM options WHERE question_id = ?',
      [questionId]
    );
    return rows;
  }

  // Update option
  static async update(id, optionData) {
    const { question_id, option_text, is_correct } = optionData;
    const [result] = await db.promisePool.query(
      'UPDATE options SET question_id = ?, option_text = ?, is_correct = ? WHERE id = ?',
      [question_id, option_text, is_correct, id]
    );
    return result.affectedRows > 0;
  }

  // Delete option
  static async delete(id) {
    const [result] = await db.promisePool.query(
      'DELETE FROM options WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Option;