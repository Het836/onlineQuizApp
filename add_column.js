const { promisePool } = require('./config/db');
async function addColumn() {
  try {
    const sql = `ALTER TABLE quiz_attempts ADD COLUMN answers TEXT NULL`;
    await promisePool.query(sql);
    console.log('Column answers added');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column answers already exists');
    } else {
      console.error('Error adding column:', err);
      process.exit(1);
    }
  } finally {
    // pool ends automatically?
  }
}
addColumn();
