import request from 'supertest'
import app from '../src/app'
import { resetDb, seedUser } from './helpers'

beforeAll(() => resetDb())   // BUG #3: should be beforeEach

describe('GET /users', () => {
  it('returns an empty array when no users exist', async () => {
    const res = await request(app).get('/users')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns all users', async () => {
    seedUser('Alice', 'alice@example.com')
    seedUser('Bob', 'bob@example.com')
    const res = await request(app).get('/users')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })
})

describe('POST /users', () => {
  it('creates a user and returns 201', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Carol', email: 'carol@example.com' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ name: 'Carol', email: 'carol@example.com' })
    expect(res.body.id).toBeDefined()
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'noname@example.com' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'NoEmail' })
    expect(res.status).toBe(400)
  })

  it('returns 409 for duplicate email', async () => {
    await request(app).post('/users').send({ name: 'Dave', email: 'dave@example.com' })
    const res = await request(app).post('/users').send({ name: 'Dave2', email: 'dave@example.com' })
    expect(res.status).toBe(409)
  })
})

describe('GET /users/:id', () => {
  it('returns the user', async () => {
    const user = seedUser('Eve', 'eve@example.com') as { id: number }
    const res = await request(app).get(`/users/${user.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ name: 'Eve' })
  })

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/users/99999')
    expect(res.status).toBe(404)
  })
})

describe('DELETE /users/:id', () => {
  it('deletes the user and returns 204', async () => {
    const user = seedUser('Frank', 'frank@example.com') as { id: number }
    const res = await request(app).delete(`/users/${user.id}`)
    expect(res.status).toBe(204)
  })

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/users/99999')
    expect(res.status).toBe(404)
  })
})
