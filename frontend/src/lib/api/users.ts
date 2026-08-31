import { apiRequest } from './client';
export type ActiveUser = { id: string; name: string | null; email: string };
export const fetchActiveUsers = () => apiRequest<ActiveUser[]>('/users/active');
