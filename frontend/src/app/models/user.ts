export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface CreateUserBody {
  name: string;
  email: string;
}
