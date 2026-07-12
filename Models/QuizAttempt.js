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
    console.log("Received answers:", answers);

    // Start a transaction
    const connection = await db.promisePool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert the attempt without answers
      const [result] = await connection.query(
        `INSERT INTO quiz_attempts
          (user_id, quiz_id, total_questions, correct_answers, wrong_answers, score, percentage, started_at, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          quiz_id,
          total_questions,
          correct_answers,
          wrong_answers,
          score,
          percentage,
          started_at,
          submitted_at
        ]
      );

      const attemptId = result.insertId;

      // Process answers if provided
      if (Array.isArray(answers) && answers.length > 0) {
        console.log("✅ Processing answers");
        console.log("Answers received in model:", answers);
        // Collect unique question IDs from answers
        const questionIds = [...new Set(answers.map(a => a.question_id))];

        // Fetch correct options for these questions
        const [correctOptions] = await connection.query(
          `SELECT question_id, id AS correct_option_id
           FROM options
           WHERE question_id IN (?) AND is_correct = 1`,
          [questionIds]
        );

        // Create a map of questionId -> correctOptionId
        const correctOptionsMap = {};
        correctOptions.forEach(opt => {
          correctOptionsMap[opt.question_id] = opt.correct_option_id;
        });

        // Prepare answer data for insertion
        const answerValues = [];
        console.log("Answer values prepared:", answerValues);
        for (const answer of answers) {
          const isCorrect = (answer.selected_option_id === correctOptionsMap[answer.question_id]) ? 1 : 0;
          answerValues.push([
            attemptId,
            answer.question_id,
            answer.selected_option_id,
            isCorrect
          ]);
        }

        // Insert all answers
        if (answerValues.length > 0) {
          console.log("🚀 Inserting into attempt_answers");
          await connection.query(
            `INSERT INTO attempt_answers
              (attempt_id, question_id, selected_option_id, is_correct)
            VALUES ?`,
            [answerValues]
          );
        }
      }

      await connection.commit();
      return { id: attemptId, ...attemptData };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      await connection.release();
    }
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
    // Get the attempt
    const [attemptRows] = await db.promisePool.query(
      'SELECT * FROM quiz_attempts WHERE id = ?',
      [id]
    );
    if (attemptRows.length === 0) return null;
    const attempt = attemptRows[0];

    // Get answers for this attempt
    const [answerRows] = await db.promisePool.query(
      `SELECT question_id, selected_option_id, is_correct
       FROM attempt_answers
       WHERE attempt_id = ?
       ORDER BY question_id`,
      [id]
    );

    // Format answers as array of objects (with is_correct)
    attempt.answers = answerRows.map(row => ({
      question_id: row.question_id,
      selected_option_id: row.selected_option_id,
      is_correct: row.is_correct === 1
    }));

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
      SELECT qa.id, qa.user_id, qa.quiz_id, qa.score, qa.percentage, qa.started_at, qa.submitted_at, qa.created_at,
             q.title AS quiz_title
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      ORDER BY qa.created_at DESC
    `);
    // Note: We no longer store answers in the quiz_attempts table, so we don't include an answers column here.
    // If the caller needs answers, they should use findByIdWithAnswers for a specific attempt.
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