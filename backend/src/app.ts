import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler'
import usersRouter from './routes/users'
import projectsRouter from './routes/projects'
import tasksRouter from './routes/tasks'

const app = express()

app.use(cors())
app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/users', usersRouter)
app.use('/projects', projectsRouter)
app.use('/tasks', tasksRouter)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler)

export default app
