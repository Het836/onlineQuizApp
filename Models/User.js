// User Model
const db = require('../config/db');

class User {
  // Create a new user
  static async create(userData) {
    const { full_name, email, password, role } = userData;
    const [result] = await db.promisePool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
      [full_name, email, password, role]
    );
    return { id: result.insertId, ...userData };
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  // Get all users
  static async findAll() {
    const [rows] = await db.promisePool.query(
      'SELECT * FROM users'
    );
    return rows;
  }

  // Update user
  static async update(id, userData) {
    const { full_name, email, password, role } = userData;
    const [result] = await db.promisePool.query(
      'UPDATE users SET full_name = ?, email = ?, password = ?, role = ? WHERE id = ?',
      [full_name, email, password, role, id]
    );
    return result.affectedRows > 0;
  }

  // Delete user
  static async delete(id) {
    const [result] = await db.promisePool.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;