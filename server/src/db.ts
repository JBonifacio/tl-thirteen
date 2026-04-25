import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'leaderboard.db')

const db = new Database(DB_PATH)

// Run schema migration in a transaction
db.transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      puzzle_date     TEXT    NOT NULL,
      nickname        TEXT    NOT NULL,
      user_token      TEXT    NOT NULL,
      position        INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
      moves           INTEGER NOT NULL CHECK (moves > 0),
      elapsed_ms      INTEGER NOT NULL CHECK (elapsed_ms >= 0),
      hint_penalty_ms INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(puzzle_date, nickname COLLATE NOCASE)
    );
    CREATE INDEX IF NOT EXISTS idx_scores_date ON scores(puzzle_date);
  `)

  // Manual migration for user_token if table existed before
  const tableInfo = db.pragma("table_info('scores')") as any[]
  const hasUserToken = tableInfo.some(col => col.name === 'user_token')
  if (!hasUserToken) {
    db.exec("ALTER TABLE scores ADD COLUMN user_token TEXT NOT NULL DEFAULT 'legacy'")
  }
})()

// Enable WAL mode for better concurrent read performance AFTER schema is ready
db.pragma('journal_mode = WAL')

export default db
