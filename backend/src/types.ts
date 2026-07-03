// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript interfaces for TaskFlow API
// ─────────────────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export interface Project {
  id: number
  name: string
  owner_id: number
  created_at: string
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  project_id: number
  assignee_id: number | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
}

export interface TaskWithTags extends Task {
  tags: string[]
}

// ── Request body shapes ───────────────────────────────────────────────────────

export interface CreateUserBody {
  name: string
  email: string
}

export interface CreateProjectBody {
  name: string
  owner_id: number
}

export interface CreateTaskBody {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string
  project_id: number
  assignee_id?: number
}

export interface UpdateTaskBody {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string | null
  assignee_id?: number | null
}

export interface AddTagBody {
  tag: string
}
