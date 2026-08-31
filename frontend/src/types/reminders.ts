export type ReminderLead = { id: string; name: string; company: string | null };
export type Reminder = { id: string; title: string; description: string | null; dueAt: string; completedAt: string | null; leadId: string | null; lead: ReminderLead | null; createdAt: string; updatedAt: string };
export type ReminderFilters = { status?: 'pending' | 'completed' | 'all'; range?: 'today' | 'upcoming' | 'overdue'; leadId?: string };
