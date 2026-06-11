# TaskFlow API

A REST API for managing tasks across teams and projects.

TaskFlow is the backend for a fictional team productivity tool. It lets you create projects, add tasks to them, assign tasks to users, and track work through a simple status workflow. There is no authentication — this is an internal tool API.

---

## Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 (LTS) |
| Language | TypeScript 5 |
| Framework | Express 4 |
| Database | SQLite (via `better-sqlite3`) |
| Tests | Jest + Supertest |
| Linter | ESLint |

---

## Getting started

```bash
# Install dependencies
npm install

# Start the development server (restarts on file changes)
npm run dev

# Run the test suite
npm test

# Type-check without emitting
npm run typecheck

# Build to /dist
npm run build
```

The server starts on **http://localhost:3000** by default.  
Set a different port with the `PORT` environment variable.

---

## Data model

```
User
  id          integer  primary key
  name        text     not null
  email       text     not null unique
  created_at  text     (ISO 8601)

Project
  id          integer  primary key
  name        text     not null
  owner_id    integer  → User.id
  created_at  text     (ISO 8601)

Task
  id           integer  primary key
  title        text     not null
  description  text
  status       text     'todo' | 'in_progress' | 'done'
  project_id   integer  → Project.id
  assignee_id  integer  → User.id  (nullable)
  created_at   text     (ISO 8601)
  updated_at   text     (ISO 8601)
```

---

## API reference

### Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/users` | List all users |
| `POST` | `/users` | Create a user |
| `GET` | `/users/:id` | Get a user |
| `DELETE` | `/users/:id` | Delete a user |

**Create user — request body**
```json
{
  "name": "Alice Chen",
  "email": "alice@example.com"
}
```

---

### Projects

| Method | Path | Description |
|---|---|---|
| `GET` | `/projects` | List all projects |
| `POST` | `/projects` | Create a project |
| `GET` | `/projects/:id` | Get a project |
| `DELETE` | `/projects/:id` | Delete a project |

**Create project — request body**
```json
{
  "name": "Website Redesign",
  "owner_id": 1
}
```

---

### Tasks

| Method | Path | Description |
|---|---|---|
| `GET` | `/tasks` | List all tasks |
| `POST` | `/tasks` | Create a task |
| `GET` | `/tasks/:id` | Get a task |
| `PATCH` | `/tasks/:id` | Update a task |
| `DELETE` | `/tasks/:id` | Delete a task |

**Create task — request body**
```json
{
  "title": "Design new homepage",
  "description": "Figma mockup first, then hand off to engineering",
  "status": "todo",
  "project_id": 1,
  "assignee_id": 2
}
```

**Update task — request body** *(all fields optional)*
```json
{
  "title": "Design new homepage",
  "description": "Updated description",
  "status": "in_progress",
  "assignee_id": 3
}
```

**Valid status values:** `todo` · `in_progress` · `done`

---

## Example session

```bash
# Create a user
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Chen","email":"alice@example.com"}' | jq

# Create a project
curl -s -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Website Redesign","owner_id":1}' | jq

# Create a task
curl -s -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Design homepage","status":"todo","project_id":1,"assignee_id":1}' | jq

# Move the task to in_progress
curl -s -X PATCH http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}' | jq

# List all tasks
curl -s http://localhost:3000/tasks | jq
```

---

## Error responses

All errors return JSON with a consistent shape:

```json
{
  "error": "Task not found"
}
```

| Status | Meaning |
|---|---|
| `400` | Validation error — check request body |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `500` | Internal server error |

---

## Project structure

```
taskflow-api/
├── src/
│   ├── app.ts              # Express app setup and route mounting
│   ├── server.ts           # Entry point — starts the HTTP server
│   ├── db.ts               # SQLite connection and schema initialisation
│   ├── types.ts            # Shared TypeScript interfaces
│   ├── routes/
│   │   ├── tasks.ts        # Task endpoints
│   │   ├── projects.ts     # Project endpoints
│   │   └── users.ts        # User endpoints
│   └── middleware/
│       └── errorHandler.ts # Global error handler
├── tests/
│   ├── tasks.test.ts
│   ├── projects.test.ts
│   ├── users.test.ts
│   └── helpers.ts          # Test database setup and teardown
├── CLAUDE.md               # Agent context (intentionally sparse — see Exercise 2)
├── WORKSHOP.md             # Exercise guide for participants
├── README.md               # This file
├── package.json
├── tsconfig.json
└── .eslintrc.json
```

---

## Known limitations

This is a workshop project, not a production API. The following are intentional omissions:

- No authentication or authorisation
- No pagination on list endpoints
- No input sanitisation beyond basic validation
- SQLite only — not suitable for concurrent write-heavy workloads

---

## Workshop context

This repo is the starter project for the **Claude Code workshop**. Some things in it are deliberately incomplete or broken. That's the point.

If you're a workshop participant: don't read ahead. Clone the repo, follow the exercises in `WORKSHOP.md`, and let the agent do the exploring.

If you're the facilitator: see the private `taskflow-workshop` repo for the solutions branch and facilitation notes.
