import { apiRequest } from './client';
import type { Lead, LeadActivity, LeadPayload, LeadsResponse, LeadStatus, ActivityType } from '../../types/leads';

export const leadKeys = { all: ['leads'] as const, detail: (id: string) => ['leads', id] as const, activities: (id: string) => ['leads', id, 'activities'] as const };

export type LeadQuery = { page: number; limit: number; search?: string; status?: LeadStatus; source?: string; serviceInterest?: string; assignedUserId?: string };
export function fetchLeads(query: LeadQuery) { const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit), sortBy: 'createdAt', sortOrder: 'desc' }); Object.entries(query).forEach(([key, value]) => { if (value && !['page', 'limit'].includes(key)) params.set(key, String(value)); }); return apiRequest<LeadsResponse>(`/leads?${params}`); }
export function createLead(payload: LeadPayload) { return apiRequest<Lead>('/leads', { method: 'POST', body: JSON.stringify(payload) }); }
export function updateLead(id: string, payload: Partial<LeadPayload>) { return apiRequest<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
export function deleteLead(id: string) { return apiRequest<{ success: boolean }>(`/leads/${id}`, { method: 'DELETE' }); }
export function fetchLead(id: string) { return apiRequest<Lead>(`/leads/${id}`); }
export function fetchLeadActivities(id: string) { return apiRequest<{ data: LeadActivity[] }>(`/leads/${id}/activities`); }
export function createLeadActivity(id: string, payload: { type: ActivityType; description: string }) { return apiRequest<LeadActivity>(`/leads/${id}/activities`, { method: 'POST', body: JSON.stringify(payload) }); }

export type PublicLeadPayload = {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  serviceInterest?: string | null;
  sourceDetail?: string | null;
  estimatedBudget?: number | null;
  message: string;
  website?: string;
};
export function createPublicLead(payload: PublicLeadPayload) { return apiRequest<{ success: boolean; id?: string }>('/public/leads', { method: 'POST', body: JSON.stringify(payload) }); }
