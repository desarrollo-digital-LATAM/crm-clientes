import { apiRequest } from './client';
import type { CreateUserPayload, ManagedUser, UpdateUserPayload } from '../../types/users';

export type ActiveUser = { id: string; name: string | null; email: string };
export const fetchActiveUsers = () => apiRequest<ActiveUser[]>('/users/active');
export const fetchUsers = () => apiRequest<ManagedUser[]>('/users');
export const createUser = (payload: CreateUserPayload) => apiRequest<ManagedUser>('/users', { method: 'POST', body: JSON.stringify(payload) });
export const updateUser = (id: string, payload: UpdateUserPayload) => apiRequest<ManagedUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
export const changeUserPassword = (id: string, password: string) => apiRequest<{ success: boolean }>(`/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) });
