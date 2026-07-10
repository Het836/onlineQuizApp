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
  try {
    console.log('Starting schema update...');

    // Check if columns already exist to avoid errors
    const [columns] = await promisePool.query(`
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
        await promisePool.query(`ALTER TABLE quiz_attempts ADD COLUMN ${col.name} ${col.definition}`);
      } else {
        console.log(`Column ${col.name} already exists.`);
      }
    }

    // Modify user_id to allow NULL if not already
    if (columnMap.user_id) {
      const userDef = columnMap.user_id;
      if (userDef.IS_NULLABLE !== 'YES') {
        console.log('Modifying user_id to allow NULL...');
        await promisePool.query('ALTER TABLE quiz_attempts MODIFY COLUMN user_id INT NULL');
      } else {
        console.log('user_id already allows NULL.');
      }
    } else {
      console.log('user_id column not found?');
    }

    console.log('Schema update completed successfully.');
  } catch (err) {
    console.error('Error updating schema:', err);
    process.exit(1);
  } finally {
    pool.end();
  }
}

updateSchema();
