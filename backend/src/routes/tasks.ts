import { Router, Request, Response, NextFunction } from 'express'
import db from '../db'
import { AddTagBody, CreateTaskBody, Task, TaskPriority, TaskStatus, TaskWithTags, UpdateTaskBody } from '../types'

const router = Router()

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

function isValidIsoDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value))
}

function badRequest(message: string) {
  const err = new Error(message) as Error & { status: number }
  err.status = 400
  return err
}

function notFound(message = 'Task not found') {
  const err = new Error(message) as Error & { status: number }
  err.status = 404
  return err
}

// Single source of truth for "what does a task look like on the wire" —
// every handler that returns a task uses this, so `tags` is always present.
function getTaskWithTags(id: number | bigint | string): TaskWithTags | undefined {
  const row = db.prepare(`
    SELECT t.*,
           (SELECT GROUP_CONCAT(tg.name, '||')
            FROM   task_tags tt
            JOIN   tags tg ON tg.id = tt.tag_id
            WHERE  tt.task_id = t.id) AS tags_raw
    FROM   tasks t
    WHERE  t.id = ?
  `).get(id) as (Task & { tags_raw: string | null }) | undefined

  if (!row) return undefined
  const { tags_raw, ...task } = row
  return { ...task, tags: tags_raw ? tags_raw.split('||') : [] }
}

// GET /tasks — list all tasks, optionally filtered by priority, overdue
// status, a due-before cutoff, and/or tag (any subset, all composable)
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const { priority, overdue, due_before, tag } = req.query as Record<string, string | undefined>

  const clauses: string[] = []
  const params: Record<string, unknown> = {}

  if (priority !== undefined) {
    if (!VALID_PRIORITIES.includes(priority as TaskPriority)) {
      return next(badRequest(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`))
    }
    clauses.push('t.priority = @priority')
    params.priority = priority
  }

  if (overdue === 'true') {
    clauses.push("t.due_date IS NOT NULL AND date(t.due_date) < date('now') AND t.status != 'done'")
  }

  if (due_before !== undefined) {
    if (!isValidIsoDate(due_before)) {
      return next(badRequest('due_before must be a valid date'))
    }
    clauses.push('t.due_date IS NOT NULL AND date(t.due_date) < date(@dueBefore)')
    params.dueBefore = due_before
  }

  let joinClause = ''
  if (tag !== undefined) {
    joinClause = 'JOIN task_tags tt ON tt.task_id = t.id JOIN tags tg ON tg.id = tt.tag_id AND tg.name = @tag'
    params.tag = tag
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''

  const rows = db.prepare(`
    SELECT t.*,
           (SELECT GROUP_CONCAT(tg2.name, '||')
            FROM   task_tags tt2
            JOIN   tags tg2 ON tg2.id = tt2.tag_id
            WHERE  tt2.task_id = t.id) AS tags_raw
    FROM   tasks t
    ${joinClause}
    ${where}
    ORDER  BY t.created_at DESC
  `).all(params) as (Task & { tags_raw: string | null })[]

  res.json(rows.map(({ tags_raw, ...t }) => ({ ...t, tags: tags_raw ? tags_raw.split('||') : [] })))
})

// GET /tasks/:id — get one task
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const task = getTaskWithTags(req.params.id)
  if (!task) return next(notFound())
  res.json(task)
})

// POST /tasks — create a task
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  const {
    title, description, status = 'todo', priority = 'medium', due_date,
    project_id, assignee_id,
  } = req.body as CreateTaskBody

  if (!title || !project_id) return next(badRequest('title and project_id are required'))
  if (!VALID_STATUSES.includes(status)) return next(badRequest(`status must be one of: ${VALID_STATUSES.join(', ')}`))
  if (!VALID_PRIORITIES.includes(priority)) return next(badRequest(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`))
  if (due_date !== undefined && !isValidIsoDate(due_date)) return next(badRequest('due_date must be a valid ISO 8601 date'))

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id)
  if (!project) return next(badRequest('project_id does not refer to an existing project'))

  const result = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, description ?? null, status, priority, due_date ?? null, project_id, assignee_id ?? null)

  res.status(201).json(getTaskWithTags(result.lastInsertRowid))
})

// PATCH /tasks/:id — update a task
router.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  const existing = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.id)
  if (!existing) return next(notFound())

  const { title, description, status, priority, due_date, assignee_id } = req.body as UpdateTaskBody

  if (status !== undefined && !VALID_STATUSES.includes(status)) return next(badRequest(`status must be one of: ${VALID_STATUSES.join(', ')}`))
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) return next(badRequest(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`))
  if (due_date != null && !isValidIsoDate(due_date)) return next(badRequest('due_date must be a valid ISO 8601 date'))

  db.prepare(`
    UPDATE tasks
    SET    title       = COALESCE(?, title),
           description = COALESCE(?, description),
           status      = COALESCE(?, status),
           priority    = COALESCE(?, priority),
           due_date    = COALESCE(?, due_date),
           assignee_id = COALESCE(?, assignee_id),
           updated_at  = datetime('now')
    WHERE  id = ?
  `).run(
    title ?? null,
    description ?? null,
    status ?? null,
    priority ?? null,
    due_date ?? null,
    assignee_id ?? null,
    req.params.id
  )

  res.json(getTaskWithTags(req.params.id))
})

// DELETE /tasks/:id — delete a task
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!task) return next(notFound())
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

// POST /tasks/:id/tags — add a tag to a task (creating the tag if new)
router.post('/:id/tags', (req: Request, res: Response, next: NextFunction) => {
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.id)
  if (!task) return next(notFound())

  const { tag } = req.body as AddTagBody
  const name = typeof tag === 'string' ? tag.trim().toLowerCase() : ''
  if (!name) return next(badRequest('tag is required'))

  db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(name)
  const tagRow = db.prepare('SELECT id FROM tags WHERE name = ?').get(name) as { id: number }
  db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(req.params.id, tagRow.id)

  res.status(201).json(getTaskWithTags(req.params.id))
})

// DELETE /tasks/:id/tags/:tag — remove a tag from a task (no-op if absent)
router.delete('/:id/tags/:tag', (req: Request, res: Response, next: NextFunction) => {
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.id)
  if (!task) return next(notFound())

  const name = req.params.tag.trim().toLowerCase()
  db.prepare(`
    DELETE FROM task_tags
    WHERE task_id = ? AND tag_id = (SELECT id FROM tags WHERE name = ?)
  `).run(req.params.id, name)

  res.status(200).json(getTaskWithTags(req.params.id))
})

export default router
