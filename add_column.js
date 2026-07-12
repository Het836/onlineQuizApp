const { promisePool } = require('./config/db');
async function addColumn() {
  console.log('Skipping addition of answers column; answers are now stored in attempt_answers table.');
  // No longer adding the answers column as we have normalized the schema.
}
addColumn();