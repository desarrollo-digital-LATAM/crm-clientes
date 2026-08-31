export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];
export const STATUS_META: Record<LeadStatus, { label: string; className: string }> = {
  NEW: { label: 'Nuevo', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-300' }, CONTACTED: { label: 'Contactado', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' }, QUALIFIED: { label: 'Calificado', className: 'bg-violet-500/10 text-violet-600 dark:text-violet-300' }, PROPOSAL: { label: 'Propuesta', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' }, NEGOTIATION: { label: 'Negociación', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' }, WON: { label: 'Ganado', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' }, LOST: { label: 'Perdido', className: 'bg-red-500/10 text-red-700 dark:text-red-300' },
};
export type Lead = { id: string; name: string; company: string | null; email: string | null; phone: string | null; serviceInterest: string | null; message: string | null; source: string; status: LeadStatus; estimatedBudget: string | null; notes: string | null; nextFollowUpAt: string | null; lastContactAt: string | null; assignedUserId: string | null; createdAt: string; updatedAt: string; assignedUser: { id: string; name: string | null; email: string } | null; client?: { id: string } | null };
export type LeadsResponse = { data: Lead[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
export type PipelineLead = Pick<Lead, 'id' | 'name' | 'company' | 'serviceInterest' | 'status' | 'nextFollowUpAt' | 'createdAt' | 'assignedUser'>;
export type PipelineResponse = Record<LeadStatus, PipelineLead[]>;
export type LeadPayload = { name: string; company?: string | null; email?: string | null; phone?: string | null; serviceInterest?: string | null; source?: string; status?: LeadStatus; estimatedBudget?: number | null; notes?: string | null; nextFollowUpAt?: string | null; lastContactAt?: string | null; assignedUserId?: string | null };
export const ACTIVITY_TYPES = ['NOTE', 'CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'FOLLOW_UP'] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number] | 'STATUS_CHANGE';
export type LeadActivity = { id: string; type: ActivityType; description: string; createdAt: string; leadId: string; userId: string; user: { id: string; name: string | null; email: string } };
