export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  project_id: number;
  assignee_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskBody {
  title: string;
  description?: string;
  status?: TaskStatus;
  project_id: number;
  assignee_id?: number;
}
