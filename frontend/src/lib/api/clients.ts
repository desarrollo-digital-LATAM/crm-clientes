import { apiRequest } from './client';
import type { Client, ClientPayload, ClientsResponse } from '../../types/clients';

export const clientKeys = { all: ['clients'] as const, lists: () => ['clients', 'list'] as const, list: (query: ClientQuery) => ['clients', 'list', query] as const, detail: (id: string) => ['clients', id] as const };
export type ClientQuery = { page: number; limit: number; search?: string; sortBy?: 'convertedAt' | 'createdAt' | 'updatedAt' | 'name'; sortOrder?: 'asc' | 'desc' };

export function fetchClients(query: ClientQuery) {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit), sortBy: query.sortBy ?? 'convertedAt', sortOrder: query.sortOrder ?? 'desc' });
  if (query.search) params.set('search', query.search);
  return apiRequest<ClientsResponse>(`/clients?${params}`);
}
export function fetchClient(id: string) { return apiRequest<Client>(`/clients/${id}`); }
export function updateClient(id: string, payload: ClientPayload) { return apiRequest<Client>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
