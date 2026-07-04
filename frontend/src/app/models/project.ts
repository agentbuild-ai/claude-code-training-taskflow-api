export interface Project {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

export interface CreateProjectBody {
  name: string;
  owner_id: number;
}
