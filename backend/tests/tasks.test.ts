import request from 'supertest'
import app from '../src/app'
import { resetDb, seedUser, seedProject, seedTask } from './helpers'

beforeAll(() => resetDb())  

let userId: number
let projectId: number

beforeAll(() => {
  const user = seedUser('Tester', 'tester@example.com') as { id: number }
  userId = user.id
  const project = seedProject('Test Project', userId) as { id: number }
  projectId = project.id
})

describe('GET /tasks', () => {
  it('returns an empty array when no tasks exist', async () => {
    const res = await request(app).get('/tasks')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns all tasks', async () => {
    seedTask(projectId, { title: 'Task A' })
    seedTask(projectId, { title: 'Task B' })
    const res = await request(app).get('/tasks')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(2)
  })

  // This test exposes BUG #2: tasks with no assignee are dropped by the INNER JOIN
  it('returns tasks that have no assignee', async () => {
    seedTask(projectId, { title: 'Unassigned Task', assignee_id: null })
    const res = await request(app).get('/tasks')
    expect(res.status).toBe(200)
    const unassigned = res.body.filter((t: { title: string }) => t.title === 'Unassigned Task')
    expect(unassigned.length).toBeGreaterThan(0)
  })
})

describe('POST /tasks', () => {
  it('creates a task and returns 201', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'New Task', project_id: projectId })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ title: 'New Task', status: 'todo' })
    expect(res.body.id).toBeDefined()
  })

  it('accepts an explicit status', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'In Progress Task', status: 'in_progress', project_id: projectId })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('in_progress')
  })

  it('returns 400 for invalid status', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Bad Status', status: 'blocked', project_id: projectId })
    expect(res.status).toBe(400)
  })

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/tasks').send({ project_id: projectId })
    expect(res.status).toBe(400)
  })

  it('returns 400 when project_id does not exist', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Ghost Task', project_id: 99999 })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /tasks/:id', () => {
  // This test exposes BUG #1: the UPDATE uses wrong column name in WHERE clause
  it('updates the task status and returns the updated task', async () => {
    const task = seedTask(projectId, { title: 'Patchable', status: 'todo' }) as { id: number }
    const res = await request(app)
      .patch(`/tasks/${task.id}`)
      .send({ status: 'done' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('done')   // FAILS: status remains 'todo'
  })

  it('returns 404 for unknown id', async () => {
    const res = await request(app).patch('/tasks/99999').send({ status: 'done' })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid status', async () => {
    const task = seedTask(projectId) as { id: number }
    const res = await request(app).patch(`/tasks/${task.id}`).send({ status: 'invalid' })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /tasks/:id', () => {
  it('deletes the task and returns 204', async () => {
    const task = seedTask(projectId, { title: 'ToDelete' }) as { id: number }
    const res = await request(app).delete(`/tasks/${task.id}`)
    expect(res.status).toBe(204)
  })

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/tasks/99999')
    expect(res.status).toBe(404)
  })
})
