import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'zcorp.db');

class DatabaseService {
  private db: sqlite3.Database | null = null;
  private connecting = false;

  private async connect(): Promise<sqlite3.Database> {
    if (this.db) {
      return this.db;
    }

    if (this.connecting) {
      // Wait for existing connection attempt
      while (this.connecting) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      if (this.db) return this.db;
    }

    this.connecting = true;

    return new Promise((resolve, reject) => {
      const database = new sqlite3.Database(DB_PATH, (err) => {
        this.connecting = false;
        if (err) {
          console.error('❌ Error connecting to database:', err.message);
          reject(err);
          return;
        }
        
        this.db = database;
        console.log('📄 Connected to SQLite database');
        resolve(database);
      });
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = await this.connect();
    
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Database query error:', err.message);
          reject(err);
          return;
        }
        resolve(rows as T[]);
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    const db = await this.connect();
    
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ Database run error:', err.message);
          reject(err);
          return;
        }
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const db = await this.connect();
    
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          console.error('❌ Database get error:', err.message);
          reject(err);
          return;
        }
        resolve(row as T);
      });
    });
  }

  async transaction<T>(callback: (db: sqlite3.Database) => Promise<T>): Promise<T> {
    const db = await this.connect();
    
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        try {
          db.run('BEGIN');
          const result = await callback(db);
          db.run('COMMIT');
          resolve(result);
        } catch (error) {
          db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  }

  async close(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
          reject(err);
          return;
        }
        this.db = null;
        console.log('📄 Database connection closed');
        resolve();
      });
    });
  }

  // Initialize database tables
  async initialize(): Promise<void> {
    console.log('🔧 Initializing database...');
    
    // Create deployments table
    await this.run(`
      CREATE TABLE IF NOT EXISTS deployments (
        id TEXT PRIMARY KEY,
        token_address TEXT NOT NULL,
        deployed_by TEXT NOT NULL,
        tx_hash TEXT NOT NULL,
        token_config TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending'
      )
    `);
    console.log('✅ Deployments table ready');

    // Create user_sessions table
    await this.run(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        user_address TEXT PRIMARY KEY,
        zcorp_balance TEXT,
        last_verified DATETIME,
        deployment_count INTEGER DEFAULT 0
      )
    `);
    console.log('✅ User sessions table ready');

    // Create indexes for better performance
    await this.run(`CREATE INDEX IF NOT EXISTS idx_deployments_user ON deployments(deployed_by)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status)`);
    await this.run(`CREATE INDEX IF NOT EXISTS idx_user_sessions_verified ON user_sessions(last_verified)`);
    
    console.log('📄 Database initialization complete');
  }
}

// Singleton instance
export const dbService = new DatabaseService();

// Legacy compatibility function (deprecated)
export function getDatabase() {
  console.warn('⚠️  getDatabase() is deprecated. Use dbService instead.');
  return new sqlite3.Database(DB_PATH);
}

// Initialize database on module load
export async function initializeDatabase() {
  try {
    await dbService.initialize();
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}