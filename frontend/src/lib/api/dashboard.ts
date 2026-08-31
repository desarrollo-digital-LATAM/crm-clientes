import { apiRequest } from './client';
import type { DashboardSummary, RecommendationsResponse } from '../../types/dashboard';

export const dashboardKeys = { all: ['dashboard'] as const, summary: ['dashboard', 'summary'] as const, recommendations: ['automation', 'recommendations'] as const };
export function fetchDashboardSummary() { return apiRequest<DashboardSummary>('/dashboard/summary'); }
export function fetchRecommendations() { return apiRequest<RecommendationsResponse>('/automation/recommendations'); }
