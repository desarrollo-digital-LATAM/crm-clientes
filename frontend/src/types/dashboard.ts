import type { ActivityType, LeadStatus } from './leads';

export type DashboardSummary = {
  leads: { total: number; new: number } & Record<LeadStatus, number>;
  clients: { total: number };
  conversion: { rate: number };
  followUps: { overdue: number; today: number; upcoming: number };
  bySource: { source: string; count: number }[];
  byService: { service: string; count: number }[];
  recentActivities: { id: string; type: ActivityType; description: string; createdAt: string; lead: { id: string; name: string }; user: { id: string; name: string | null; email: string } }[];
  upcomingFollowUps: { id: string; name: string; company: string | null; status: LeadStatus; nextFollowUpAt: string }[];
};

export type Recommendation = { type: 'NO_FOLLOW_UP' | 'OVERDUE_FOLLOW_UP' | 'STALE_CONTACT' | 'UNASSIGNED' | 'WON_NOT_CONVERTED'; priority: 'HIGH' | 'MEDIUM' | 'LOW'; leadId: string; leadName: string; message: string; action: 'OPEN_LEAD' | 'CONVERT_CLIENT' | 'SCHEDULE_FOLLOW_UP' | 'RESCHEDULE_FOLLOW_UP' | 'ASSIGN_OWNER' };
export type RecommendationsResponse = { summary: { total: number; high: number; medium: number }; items: Recommendation[] };
