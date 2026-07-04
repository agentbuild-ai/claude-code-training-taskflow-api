export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project_id: number;
  assignee_id: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaskBody {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  project_id: number;
  assignee_id?: number;
}

export interface TaskFilters {
  priority?: TaskPriority;
  overdue?: boolean;
  due_before?: string;
  tag?: string;
}
