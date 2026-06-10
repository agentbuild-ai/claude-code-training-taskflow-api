import { Router, Request, Response, NextFunction } from 'express'
import db from '../db'
import { CreateTaskBody, UpdateTaskBody, TaskStatus } from '../types'

const router = Router()

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

// GET /tasks — list all tasks
// BUG #2: Uses INNER JOIN — tasks whose assignee has been deleted are silently
// dropped from results. Should be LEFT JOIN to preserve unassigned tasks.
router.get('/', (_req: Request, res: Response) => {
  const tasks = db.prepare(`
    SELECT t.*
    FROM   tasks t
    JOIN   users u ON t.assignee_id = u.id
    ORDER  BY t.created_at DESC
  `).all()
  res.json(tasks)
})

// GET /tasks/:id — get one task
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!task) {
    const err = new Error('Task not found') as Error & { status: number }
    err.status = 404
    return next(err)
  }
  res.json(task)
})

// POST /tasks — create a task
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  const { title, description, status = 'todo', project_id, assignee_id } = req.body as CreateTaskBody

  if (!title || !project_id) {
    const err = new Error('title and project_id are required') as Error & { status: number }
    err.status = 400
    return next(err)
  }

  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`) as Error & { status: number }
    err.status = 400
    return next(err)
  }

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id)
  if (!project) {
    const err = new Error('project_id does not refer to an existing project') as Error & { status: number }
    err.status = 400
    return next(err)
  }

  const result = db.prepare(`
    INSERT INTO tasks (title, description, status, project_id, assignee_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, description ?? null, status, project_id, assignee_id ?? null)

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(task)
})

// PATCH /tasks/:id — update a task
// BUG #1: The UPDATE statement references the wrong column name in the WHERE
// clause (uses 'task_id' instead of 'id'), so no row is ever updated.
// The endpoint returns 200 but the database is unchanged.
router.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!task) {
    const err = new Error('Task not found') as Error & { status: number }
    err.status = 404
    return next(err)
  }

  const { title, description, status, assignee_id } = req.body as UpdateTaskBody

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    const err = new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`) as Error & { status: number }
    err.status = 400
    return next(err)
  }

  // BUG #1 is here: WHERE task_id = ? should be WHERE id = ?
  db.prepare(`
    UPDATE tasks
    SET    title       = COALESCE(?, title),
           description = COALESCE(?, description),
           status      = COALESCE(?, status),
           assignee_id = COALESCE(?, assignee_id),
           updated_at  = datetime('now')
    WHERE  task_id = ?
  `).run(
    title ?? null,
    description ?? null,
    status ?? null,
    assignee_id ?? null,
    req.params.id
  )

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  res.json(updated)
})

// DELETE /tasks/:id — delete a task
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
  if (!task) {
    const err = new Error('Task not found') as Error & { status: number }
    err.status = 404
    return next(err)
  }
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

export default router
