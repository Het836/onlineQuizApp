require('dotenv').config({ path: './.env' });
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quiz_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

async function updateSchema() {
  let connection;
  try {
    console.log('Starting schema update...');
    connection = await promisePool.getConnection();

    // Start transaction for safety
    await connection.beginTransaction();

    // Check if columns already exist to avoid errors
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'quiz_attempts'
    `);
    const columnMap = {};
    columns.forEach(col => {
      columnMap[col.COLUMN_NAME] = col;
    });

    // List of columns to add: name, definition
    const columnsToAdd = [
      { name: 'total_questions', definition: 'INT NOT NULL DEFAULT 0' },
      { name: 'correct_answers', definition: 'INT NOT NULL DEFAULT 0' },
      { name: 'wrong_answers', definition: 'INT NOT NULL DEFAULT 0' },
      { name: 'percentage', definition: 'DECIMAL(5,2) NOT NULL DEFAULT 0.00' },
      { name: 'created_at', definition: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP' }
    ];

    for (const col of columnsToAdd) {
      if (!columnMap[col.name]) {
        console.log(`Adding column ${col.name}...`);
        await connection.query(`ALTER TABLE quiz_attempts ADD COLUMN ${col.name} ${col.definition}`);
      } else {
        console.log(`Column ${col.name} already exists.`);
      }
    }

    // Check and add columns to users table
    const [userColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
    `);
    const userColumnMap = {};
    userColumns.forEach(col => {
      userColumnMap[col.COLUMN_NAME] = col;
    });

    const usersColumnsToAdd = [
      { name: 'updated_at', definition: 'TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP' }
    ];

    for (const col of usersColumnsToAdd) {
      if (!userColumnMap[col.name]) {
        console.log(`Adding column ${col.name} to users table...`);
        await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.definition}`);
      } else {
        console.log(`Column ${col.name} already exists in users table.`);
      }
    }

    // Modify user_id to allow NULL if not already
    if (columnMap.user_id) {
      const userDef = columnMap.user_id;
      if (userDef.IS_NULLABLE !== 'YES') {
        console.log('Modifying user_id to allow NULL...');
        await connection.query('ALTER TABLE quiz_attempts MODIFY COLUMN user_id INT NULL');
      } else {
        console.log('user_id already allows NULL.');
      }
    } else {
      console.log('user_id column not found?');
    }

    // Create attempt_answers table if it doesn't exist
    const [tables] = await connection.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'attempt_answers'
    `);
    if (tables.length === 0) {
      console.log('Creating attempt_answers table...');
      await connection.query(`
        CREATE TABLE attempt_answers (
          id INT PRIMARY KEY AUTO_INCREMENT,
          attempt_id INT NOT NULL,
          question_id INT NOT NULL,
          selected_option_id INT NOT NULL,
          is_correct BOOLEAN NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
          FOREIGN KEY (selected_option_id) REFERENCES options(id) ON DELETE CASCADE
        )
      `);

      // Add indexes for attempt_answers
      await connection.query('CREATE INDEX idx_attempt_answers_attempt_id ON attempt_answers(attempt_id)');
      await connection.query('CREATE INDEX idx_attempt_answers_question_id ON attempt_answers(question_id)');
      await connection.query('CREATE INDEX idx_attempt_answers_option_id ON attempt_answers(selected_option_id)');

      console.log('attempt_answers table created successfully.');
    } else {
      console.log('attempt_answers table already exists.');
    }

    // Remove the answers column from quiz_attempts if it exists (we are normalizing storage)
    if (columnMap.answers) {
      console.log('Removing answers column from quiz_attempts...');
      await connection.query('ALTER TABLE quiz_attempts DROP COLUMN answers');
      console.log('answers column removed.');
    } else {
      console.log('answers column does not exist in quiz_attempts (already normalized).');
    }

    await connection.commit();
    console.log('Schema update completed successfully.');
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error updating schema:', err);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    pool.end();
  }
}

updateSchema();