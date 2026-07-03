import request from 'supertest'
import app from '../src/app'
import { resetDb, seedUser, seedProject, seedTask, seedTag, seedTaskTag } from './helpers'

let userId: number
let projectId: number

beforeEach(() => {
  resetDb()
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
    expect(res.body).toMatchObject({ title: 'New Task', status: 'todo', priority: 'medium', tags: [] })
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

  it('accepts a valid priority', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'High Priority', priority: 'high', project_id: projectId })
    expect(res.status).toBe(201)
    expect(res.body.priority).toBe('high')
  })

  it('defaults to medium priority when omitted', async () => {
    const res = await request(app).post('/tasks').send({ title: 'No Priority', project_id: projectId })
    expect(res.status).toBe(201)
    expect(res.body.priority).toBe('medium')
  })

  it('returns 400 for invalid priority', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Bad Priority', priority: 'urgent', project_id: projectId })
    expect(res.status).toBe(400)
  })

  it('accepts a valid due_date', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Has Due Date', due_date: '2026-01-01', project_id: projectId })
    expect(res.status).toBe(201)
    expect(res.body.due_date).toBe('2026-01-01')
  })

  it('returns 400 for malformed due_date', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Bad Due Date', due_date: 'not-a-date', project_id: projectId })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /tasks/:id', () => {
  it('updates the task status and returns the updated task', async () => {
    const task = seedTask(projectId, { title: 'Patchable', status: 'todo' }) as { id: number }
    const res = await request(app)
      .patch(`/tasks/${task.id}`)
      .send({ status: 'done' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('done')
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

  it('updates priority', async () => {
    const task = seedTask(projectId, { priority: 'low' }) as { id: number }
    const res = await request(app).patch(`/tasks/${task.id}`).send({ priority: 'high' })
    expect(res.status).toBe(200)
    expect(res.body.priority).toBe('high')
  })

  it('returns 400 for invalid priority on update', async () => {
    const task = seedTask(projectId) as { id: number }
    const res = await request(app).patch(`/tasks/${task.id}`).send({ priority: 'urgent' })
    expect(res.status).toBe(400)
  })

  it('updates due_date', async () => {
    const task = seedTask(projectId) as { id: number }
    const res = await request(app).patch(`/tasks/${task.id}`).send({ due_date: '2026-06-01' })
    expect(res.status).toBe(200)
    expect(res.body.due_date).toBe('2026-06-01')
  })

  it('returns 400 for malformed due_date on update', async () => {
    const task = seedTask(projectId) as { id: number }
    const res = await request(app).patch(`/tasks/${task.id}`).send({ due_date: 'not-a-date' })
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

  it("cascades to remove the task's tag associations", async () => {
    const task = seedTask(projectId) as { id: number }
    const tag = seedTag('urgent') as { id: number }
    seedTaskTag(task.id, tag.id)

    await request(app).delete(`/tasks/${task.id}`)

    const other = seedTask(projectId, { title: 'Other' }) as { id: number }
    const res = await request(app).post(`/tasks/${other.id}/tags`).send({ tag: 'urgent' })
    expect(res.status).toBe(201)
    expect(res.body.tags).toEqual(['urgent'])
  })
})

describe('GET /tasks filtering', () => {
  it('filters by priority', async () => {
    seedTask(projectId, { title: 'Low', priority: 'low' })
    seedTask(projectId, { title: 'High', priority: 'high' })
    const res = await request(app).get('/tasks?priority=high')
    expect(res.status).toBe(200)
    expect(res.body.every((t: { priority: string }) => t.priority === 'high')).toBe(true)
    expect(res.body.some((t: { title: string }) => t.title === 'High')).toBe(true)
  })

  it('returns 400 for an invalid priority filter', async () => {
    const res = await request(app).get('/tasks?priority=urgent')
    expect(res.status).toBe(400)
  })

  it('returns only overdue, non-done tasks with a due_date', async () => {
    seedTask(projectId, { title: 'Overdue', due_date: '2020-01-01', status: 'todo' })
    seedTask(projectId, { title: 'Future', due_date: '2099-01-01', status: 'todo' })
    seedTask(projectId, { title: 'Overdue Done', due_date: '2020-01-01', status: 'done' })
    seedTask(projectId, { title: 'No Due Date' })

    const res = await request(app).get('/tasks?overdue=true')
    expect(res.status).toBe(200)
    const titles = res.body.map((t: { title: string }) => t.title)
    expect(titles).toContain('Overdue')
    expect(titles).not.toContain('Future')
    expect(titles).not.toContain('Overdue Done')
    expect(titles).not.toContain('No Due Date')
  })

  it('excludes tasks with no due date from due_before without erroring', async () => {
    seedTask(projectId, { title: 'No Due Date' })
    const res = await request(app).get('/tasks?due_before=2099-01-01')
    expect(res.status).toBe(200)
    expect(res.body.some((t: { title: string }) => t.title === 'No Due Date')).toBe(false)
  })

  it('filters by due_before', async () => {
    seedTask(projectId, { title: 'Early', due_date: '2020-01-01' })
    seedTask(projectId, { title: 'Late', due_date: '2099-01-01' })
    const res = await request(app).get('/tasks?due_before=2050-01-01')
    expect(res.status).toBe(200)
    const titles = res.body.map((t: { title: string }) => t.title)
    expect(titles).toContain('Early')
    expect(titles).not.toContain('Late')
  })

  it('returns 400 for a malformed due_before', async () => {
    const res = await request(app).get('/tasks?due_before=not-a-date')
    expect(res.status).toBe(400)
  })

  it('composes priority and overdue filters', async () => {
    seedTask(projectId, { title: 'High Overdue', priority: 'high', due_date: '2020-01-01', status: 'todo' })
    seedTask(projectId, { title: 'Low Overdue', priority: 'low', due_date: '2020-01-01', status: 'todo' })
    const res = await request(app).get('/tasks?priority=high&overdue=true')
    expect(res.status).toBe(200)
    const titles = res.body.map((t: { title: string }) => t.title)
    expect(titles).toContain('High Overdue')
    expect(titles).not.toContain('Low Overdue')
  })
})

describe('POST /tasks/:id/tags', () => {
  it('adds a tag to a task, creating the tag row if new', async () => {
    const task = seedTask(projectId) as { id: number }
    const res = await request(app).post(`/tasks/${task.id}/tags`).send({ tag: 'urgent' })
    expect(res.status).toBe(201)
    expect(res.body.tags).toEqual(['urgent'])
  })

  it('adding an existing tag is idempotent', async () => {
    const task = seedTask(projectId) as { id: number }
    await request(app).post(`/tasks/${task.id}/tags`).send({ tag: 'urgent' })
    const res = await request(app).post(`/tasks/${task.id}/tags`).send({ tag: 'urgent' })
    expect(res.status).toBe(201)
    expect(res.body.tags).toEqual(['urgent'])
  })

  it('returns 404 for a nonexistent task', async () => {
    const res = await request(app).post('/tasks/99999/tags').send({ tag: 'urgent' })
    expect(res.status).toBe(404)
  })

  it('returns 400 when tag is missing or blank', async () => {
    const task = seedTask(projectId) as { id: number }
    const res = await request(app).post(`/tasks/${task.id}/tags`).send({ tag: '  ' })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /tasks/:id/tags/:tag', () => {
  it('removes a tag from a task', async () => {
    const task = seedTask(projectId) as { id: number }
    await request(app).post(`/tasks/${task.id}/tags`).send({ tag: 'urgent' })
    const res = await request(app).delete(`/tasks/${task.id}/tags/urgent`)
    expect(res.status).toBe(200)
    expect(res.body.tags).toEqual([])
  })

  it('removing a tag the task does not have is a no-op, not an error', async () => {
    const task = seedTask(projectId) as { id: number }
    const res = await request(app).delete(`/tasks/${task.id}/tags/never-added`)
    expect(res.status).toBe(200)
    expect(res.body.tags).toEqual([])
  })

  it('returns 404 for a nonexistent task', async () => {
    const res = await request(app).delete('/tasks/99999/tags/urgent')
    expect(res.status).toBe(404)
  })
})

describe('GET /tasks?tag=', () => {
  it('filters tasks by tag', async () => {
    const tagged = seedTask(projectId, { title: 'Tagged' }) as { id: number }
    seedTask(projectId, { title: 'Untagged' })
    const urgent = seedTag('urgent') as { id: number }
    seedTaskTag(tagged.id, urgent.id)

    const res = await request(app).get('/tasks?tag=urgent')
    expect(res.status).toBe(200)
    const titles = res.body.map((t: { title: string }) => t.title)
    expect(titles).toContain('Tagged')
    expect(titles).not.toContain('Untagged')
  })

  it('composes tag filter with priority and overdue', async () => {
    const match = seedTask(projectId, { title: 'Match', priority: 'high', due_date: '2020-01-01', status: 'todo' }) as { id: number }
    const wrongPriority = seedTask(projectId, { title: 'WrongPriority', priority: 'low', due_date: '2020-01-01', status: 'todo' }) as { id: number }
    const urgent = seedTag('urgent') as { id: number }
    seedTaskTag(match.id, urgent.id)
    seedTaskTag(wrongPriority.id, urgent.id)

    const res = await request(app).get('/tasks?tag=urgent&priority=high&overdue=true')
    expect(res.status).toBe(200)
    const titles = res.body.map((t: { title: string }) => t.title)
    expect(titles).toContain('Match')
    expect(titles).not.toContain('WrongPriority')
  })
})
