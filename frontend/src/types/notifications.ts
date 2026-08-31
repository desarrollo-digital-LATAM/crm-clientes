export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationFilter = 'all' | 'unread' | 'read';
export type NotificationsResponse = { data: Notification[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
