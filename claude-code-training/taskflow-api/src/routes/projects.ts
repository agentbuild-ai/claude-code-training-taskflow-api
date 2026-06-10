import { Router, Request, Response, NextFunction } from 'express'
import db from '../db'
import { CreateProjectBody } from '../types'

const router = Router()

// GET /projects — list all projects
router.get('/', (_req: Request, res: Response) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
  res.json(projects)
})

// GET /projects/:id — get one project
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!project) {
    const err = new Error('Project not found') as Error & { status: number }
    err.status = 404
    return next(err)
  }
  res.json(project)
})

// POST /projects — create a project
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  const { name, owner_id } = req.body as CreateProjectBody

  if (!name || !owner_id) {
    const err = new Error('name and owner_id are required') as Error & { status: number }
    err.status = 400
    return next(err)
  }

  const owner = db.prepare('SELECT id FROM users WHERE id = ?').get(owner_id)
  if (!owner) {
    const err = new Error('owner_id does not refer to an existing user') as Error & { status: number }
    err.status = 400
    return next(err)
  }

  const result = db.prepare(
    'INSERT INTO projects (name, owner_id) VALUES (?, ?)'
  ).run(name, owner_id)

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(project)
})

// DELETE /projects/:id — delete a project (cascades to tasks)
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!project) {
    const err = new Error('Project not found') as Error & { status: number }
    err.status = 404
    return next(err)
  }
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

export default router
