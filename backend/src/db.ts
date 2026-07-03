import Database from 'better-sqlite3'
import path from 'path'

// ─────────────────────────────────────────────────────────────────────────────
// Database connection
// Uses an in-memory DB during tests, file-based DB otherwise.
// ─────────────────────────────────────────────────────────────────────────────

const DB_PATH = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(__dirname, '..', 'taskflow.db')

const db = new Database(DB_PATH)

// SQLite does not enforce declared foreign keys (including ON DELETE
// CASCADE/SET NULL) unless this is turned on for the connection.
db.pragma('foreign_keys = ON')

// Enable WAL mode for better concurrent read performance (skipped for in-memory)
if (DB_PATH !== ':memory:') {
  db.pragma('journal_mode = WAL')
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      owner_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      description TEXT,
      status      TEXT    NOT NULL DEFAULT 'todo'
                          CHECK(status IN ('todo','in_progress','done')),
      priority    TEXT    NOT NULL DEFAULT 'medium'
                          CHECK(priority IN ('low','medium','high')),
      due_date    TEXT,
      project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS task_tags (
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
      PRIMARY KEY (task_id, tag_id)
    );
  `)
}

export default db
