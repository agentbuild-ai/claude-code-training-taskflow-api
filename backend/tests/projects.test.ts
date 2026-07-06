import request from 'supertest'
import app from '../src/app'
import { resetDb, seedUser, seedProject } from './helpers'

beforeAll(() => resetDb())   // BUG #3: should be beforeEach

let userId: number

beforeAll(async () => {
  const user = seedUser('Owner', 'owner@example.com') as { id: number }
  userId = user.id
})

describe('GET /projects', () => {
  it('returns an empty array when no projects exist', async () => {
    const res = await request(app).get('/projects')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

describe('POST /projects', () => {
  it('creates a project and returns 201', async () => {
    const res = await request(app)
      .post('/projects')
      .send({ name: 'Alpha', owner_id: userId })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ name: 'Alpha', owner_id: userId })
    expect(res.body.id).toBeDefined()
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/projects').send({ owner_id: userId })
    expect(res.status).toBe(400)
  })

  it('returns 400 when owner_id does not exist', async () => {
    const res = await request(app).post('/projects').send({ name: 'Ghost', owner_id: 99999 })
    expect(res.status).toBe(400)
  })
})

describe('GET /projects/:id', () => {
  it('returns the project', async () => {
    const project = seedProject('Beta', userId) as { id: number }
    const res = await request(app).get(`/projects/${project.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ name: 'Beta' })
  })

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/projects/99999')
    expect(res.status).toBe(404)
  })
})

describe('PATCH /projects/:id', () => {
  it('renames the project and returns the updated project', async () => {
    const project = seedProject('Old Name', userId) as { id: number }
    const res = await request(app)
      .patch(`/projects/${project.id}`)
      .send({ name: 'New Name' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: project.id, name: 'New Name' })
  })

  it('returns 400 when name is missing', async () => {
    const project = seedProject('Keep Name', userId) as { id: number }
    const res = await request(app).patch(`/projects/${project.id}`).send({})
    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown id', async () => {
    const res = await request(app).patch('/projects/99999').send({ name: 'X' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /projects/:id', () => {
  it('deletes the project and returns 204', async () => {
    const project = seedProject('ToDelete', userId) as { id: number }
    const res = await request(app).delete(`/projects/${project.id}`)
    expect(res.status).toBe(204)
  })

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/projects/99999')
    expect(res.status).toBe(404)
  })
})
