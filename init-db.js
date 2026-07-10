const mysql = require('mysql2');
require('dotenv').config({ path: './.env' });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

function connect() {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(config);
    connection.connect((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
}

function query(connection, sql) {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

async function initDatabase() {
  let connection;
  try {
    connection = await connect();
    console.log('Connected to MySQL server');

    const dbName = process.env.DB_NAME || 'quiz_db';
    await query(connection, `CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' ensured`);

    await query(connection, `USE \`${dbName}\``);
    console.log(`Using database '${dbName}'`);

    // Execute schema.sql
    const fs = require('fs');
    const schemaSql = fs.readFileSync('./database/schema.sql', 'utf8');
    await query(connection, schemaSql);
    console.log('Schema executed successfully');

    // Execute seed.sql
    const seedSql = fs.readFileSync('./database/seed.sql', 'utf8');
    await query(connection, seedSql);
    console.log('Seed executed successfully');

    console.log('Database initialization completed successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

initDatabase();