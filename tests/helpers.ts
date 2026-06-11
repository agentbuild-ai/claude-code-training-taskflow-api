import db, { initSchema } from '../src/db'

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
//
// BUG #3 (subtle): resetDb() clears data between tests, but the schema is
// only initialised ONCE at module load time. If tests share the same db
// instance without resetting, state bleeds between test files when Jest runs
// them in the same process (which --runInBand does).
//
// The fix: call resetDb() in beforeEach, not just beforeAll.
// Currently tests only call it in beforeAll — so tests within a file are
// isolated, but state leaks across files.
// ─────────────────────────────────────────────────────────────────────────────

initSchema()

export function resetDb(): void {
  db.exec(`
    DELETE FROM tasks;
    DELETE FROM projects;
    DELETE FROM users;
  `)
}

// Seed helpers — convenience functions for creating test data

export function seedUser(name = 'Alice', email = 'alice@example.com') {
  const result = db.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?)'
  ).run(name, email)
  return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
}

export function seedProject(name = 'Test Project', ownerId: number) {
  const result = db.prepare(
    'INSERT INTO projects (name, owner_id) VALUES (?, ?)'
  ).run(name, ownerId)
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
}

export function seedTask(projectId: number, overrides: Record<string, unknown> = {}) {
  const defaults = {
    title: 'Test Task',
    description: null,
    status: 'todo',
    assignee_id: null,
  }
  const t = { ...defaults, ...overrides }
  const result = db.prepare(`
    INSERT INTO tasks (title, description, status, project_id, assignee_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(t.title, t.description, t.status, projectId, t.assignee_id)
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid)
}
