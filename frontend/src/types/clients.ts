import type { LeadStatus } from './leads';

export type Client = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  sourceLeadId: string;
  convertedAt: string;
  createdAt: string;
  updatedAt: string;
  sourceLead: { id: string; status: LeadStatus; source: string; createdAt: string };
};

export type ClientsResponse = { data: Client[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
export type ClientPayload = { name?: string; company?: string | null; email?: string | null; phone?: string | null; notes?: string | null };
