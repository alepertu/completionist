import sqlite3 from 'sqlite3';

const sql = sqlite3.verbose();

function connectToDatabase() {
  const db = new sql.Database('../../completionist.db');
  return db;
}

module.exports = {
  connectToDatabase,
};
