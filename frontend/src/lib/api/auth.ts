import { apiRequest } from './client';

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'MEMBER';
};

export function fetchCurrentUser() {
  return apiRequest<CurrentUser>('/auth/me');
}

export function login(email: string, password: string) {
  return apiRequest<CurrentUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return apiRequest<{ success: boolean }>('/auth/logout', { method: 'POST' });
}
