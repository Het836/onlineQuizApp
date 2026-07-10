// QuizAttempt Model
const db = require('../config/db');

class QuizAttempt {
  // Create a new quiz attempt with answers
  static async create(attemptData) {
    const {
      user_id,
      quiz_id,
      total_questions,
      correct_answers,
      wrong_answers,
      score,
      percentage,
      answers, // array of {question_id, selected_option_id}
      started_at,
      submitted_at
    } = attemptData;
    const answersJSON = JSON.stringify(answers);
    const [result] = await db.promisePool.query(
      `INSERT INTO quiz_attempts 
        (user_id, quiz_id, total_questions, correct_answers, wrong_answers, score, percentage, answers, started_at, submitted_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        quiz_id,
        total_questions,
        correct_answers,
        wrong_answers,
        score,
        percentage,
        answersJSON,
        started_at,
        submitted_at
      ]
    );
    return { id: result.insertId, ...attemptData };
  }

  // Find attempt by ID
  static async findById(id) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM quiz_attempts WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Find attempt by ID with parsed answers
  static async findByIdWithAnswers(id) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM quiz_attempts WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    const attempt = rows[0];
    attempt.answers = JSON.parse(attempt.answers);
    return attempt;
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

  // Get all attempts with quiz title
  static async findAllWithQuizTitle() {
    const [rows] = await db.promisePool.query(`
      SELECT qa.id, qa.user_id, qa.quiz_id, qa.score, qa.percentage, qa.answers, qa.started_at, qa.submitted_at, qa.created_at,
             q.title AS quiz_title
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      ORDER BY qa.created_at DESC
    `);
    // Parse answers JSON
    for (const row of rows) {
      if (row.answers) {
        try {
          row.answers = JSON.parse(row.answers);
        } catch (e) {
          row.answers = [];
        }
      }
    }
    return rows;
  }

  // Update attempt (score, submitted_at)
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
