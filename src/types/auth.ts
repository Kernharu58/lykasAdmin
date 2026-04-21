export interface User {
  id?: string;
  _id?: string;
  displayName: string;
  email: string;
  role: 'admin' | 'staff' | 'user';
  profilePicture?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}