import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'zcorp.db');

export function createDatabase() {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('📄 Connected to SQLite database');
  });

  // Create deployments table
  db.run(`
    CREATE TABLE IF NOT EXISTS deployments (
      id TEXT PRIMARY KEY,
      token_address TEXT NOT NULL,
      deployed_by TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      token_config TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending'
    )
  `, (err) => {
    if (err) {
      console.error('Error creating deployments table:', err.message);
    } else {
      console.log('✅ Deployments table ready');
    }
  });

  // Create user_sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      user_address TEXT PRIMARY KEY,
      zcorp_balance TEXT,
      last_verified DATETIME,
      deployment_count INTEGER DEFAULT 0
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_sessions table:', err.message);
    } else {
      console.log('✅ User sessions table ready');
    }
  });

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('📄 Database initialization complete');
    }
  });
}

export function getDatabase() {
  return new sqlite3.Database(DB_PATH);
}