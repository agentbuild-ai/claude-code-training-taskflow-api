import { Router, Request, Response, NextFunction } from 'express'
import db from '../db'
import { CreateUserBody } from '../types'

const router = Router()

// GET /users — list all users
router.get('/', (_req: Request, res: Response) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
  res.json(users)
})

// GET /users/:id — get one user
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!user) {
    const err = new Error('User not found') as Error & { status: number }
    err.status = 404
    return next(err)
  }
  res.json(user)
})

// POST /users — create a user
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  const { name, email } = req.body as CreateUserBody

  if (!name || !email) {
    const err = new Error('name and email are required') as Error & { status: number }
    err.status = 400
    return next(err)
  }

  try {
    const result = db.prepare(
      'INSERT INTO users (name, email) VALUES (?, ?)'
    ).run(name, email)

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(user)
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('UNIQUE')) {
      const err = new Error('A user with that email already exists') as Error & { status: number }
      err.status = 409
      return next(err)
    }
    next(e)
  }
})

// DELETE /users/:id — delete a user
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!user) {
    const err = new Error('User not found') as Error & { status: number }
    err.status = 404
    return next(err)
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

export default router
