import { apiRequest } from './client';
import type { NotificationFilter, NotificationsResponse, Notification } from '../../types/notifications';

export const notificationKeys = { all: ['notifications'] as const, lists: () => [...notificationKeys.all, 'list'] as const, list: (filter: NotificationFilter = 'all', page = 1) => [...notificationKeys.lists(), filter, page] as const, unreadCount: ['notifications', 'unread-count'] as const };
export const fetchNotifications = (filter: NotificationFilter = 'all', page = 1, limit = 20) => apiRequest<NotificationsResponse>(`/notifications?filter=${filter}&page=${page}&limit=${limit}`);
export const fetchUnreadCount = () => apiRequest<{ count: number }>('/notifications/unread-count');
export const markNotificationRead = (id: string) => apiRequest<Notification>(`/notifications/${id}/read`, { method: 'PATCH' });
export const markAllNotificationsRead = () => apiRequest<{ success: true }>('/notifications/read-all', { method: 'PATCH' });
