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
//
// There's no migration framework here — CREATE TABLE IF NOT EXISTS defines
// the shape for a brand-new database. For columns added to an existing table
// after its initial release (like `priority`/`due_date` below), ensureColumn
// backfills them on top of a pre-existing table so an old on-disk
// taskflow.db self-upgrades instead of erroring with "no such column".
// This only handles additive changes (new columns) — a column type change,
// rename, or removal still needs a real migration.
// ─────────────────────────────────────────────────────────────────────────────

function ensureColumn(table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

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

  // Backfill columns added after the initial release, for pre-existing
  // on-disk databases that predate them (no-op on a freshly created table,
  // since CREATE TABLE above already includes these columns).
  ensureColumn('tasks', 'priority', "TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high'))")
  ensureColumn('tasks', 'due_date', 'TEXT')
}

export default db
