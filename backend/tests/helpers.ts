import db, { initSchema } from '../src/db'

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
//
// The schema is initialised once at module load time; resetDb() clears data
// between tests. Call it from beforeEach (not just beforeAll) in every test
// file — Jest runs all test files in the same process under --runInBand, so
// a beforeAll-only reset lets state leak across files.
// ─────────────────────────────────────────────────────────────────────────────

initSchema()

export function resetDb(): void {
  db.exec(`
    DELETE FROM task_tags;
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
    priority: 'medium',
    due_date: null,
    assignee_id: null,
  }
  const t = { ...defaults, ...overrides }
  const result = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(t.title, t.description, t.status, t.priority, t.due_date, projectId, t.assignee_id)
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid)
}

// tags aren't cleared by resetDb() (they're a reusable dictionary, same as
// in the app itself), so this is idempotent — reuses the row if it exists.
export function seedTag(name = 'urgent') {
  db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(name)
  return db.prepare('SELECT * FROM tags WHERE name = ?').get(name)
}

export function seedTaskTag(taskId: number, tagId: number): void {
  db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(taskId, tagId)
}
