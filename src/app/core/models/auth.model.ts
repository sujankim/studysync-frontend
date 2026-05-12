export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  plan: 'FREE' | 'PRO';
}

export interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}
