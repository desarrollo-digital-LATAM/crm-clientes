import { apiRequest } from './client';
import type { Reminder, ReminderFilters } from '../../types/reminders';

export const reminderKeys = { all: ['reminders'] as const, lists: () => [...reminderKeys.all, 'list'] as const, list: (filters: ReminderFilters = {}) => [...reminderKeys.lists(), filters] as const, byLead: (leadId: string) => [...reminderKeys.all, 'lead', leadId] as const };
export const fetchReminders = (filters: ReminderFilters = {}) => apiRequest<Reminder[]>(`/reminders?${new URLSearchParams(filters as Record<string, string>).toString()}`);
export const fetchLeadReminders = (leadId: string) => fetchReminders({ status: 'all', leadId } as ReminderFilters & { leadId: string });
export const createReminder = (data: { title: string; description?: string; dueAt: string; leadId?: string | null }) => apiRequest<Reminder>('/reminders', { method: 'POST', body: JSON.stringify(data) });
export const updateReminder = (id: string, data: Partial<Pick<Reminder, 'title' | 'description' | 'dueAt' | 'completedAt' | 'leadId'>>) => apiRequest<Reminder>(`/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteReminder = (id: string) => apiRequest<{ success: true }>(`/reminders/${id}`, { method: 'DELETE' });
