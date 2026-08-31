import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const notification = { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn() };
  const service = new NotificationsService({ notification } as never);

  beforeEach(() => jest.clearAllMocks());

  it('lists only the current owner, applies read filters and orders newest first', async () => {
    notification.findMany.mockResolvedValue([]);
    notification.count.mockResolvedValue(0);
    await service.findAll({ page: 1, limit: 20, filter: 'all' }, 'user-1');
    expect(notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' }, orderBy: { createdAt: 'desc' }, take: 20 }));
    await service.findAll({ page: 1, limit: 20, filter: 'unread' }, 'user-1');
    expect(notification.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { userId: 'user-1', readAt: null } }));
    await service.findAll({ page: 1, limit: 20, filter: 'read' }, 'user-1');
    expect(notification.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { userId: 'user-1', readAt: { not: null } } }));
  });

  it('returns unread count for the current owner', async () => {
    notification.count.mockResolvedValue(4);
    await expect(service.unreadCount('user-1')).resolves.toEqual({ count: 4 });
    expect(notification.count).toHaveBeenCalledWith({ where: { userId: 'user-1', readAt: null } });
  });

  it('marks only an owned notification as read and is idempotent', async () => {
    notification.updateMany.mockResolvedValue({ count: 1 });
    notification.findUnique.mockResolvedValue({ id: 'notification-1', userId: 'user-1', readAt: new Date() });
    await service.markRead('notification-1', 'user-1');
    expect(notification.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'notification-1', userId: 'user-1', readAt: null } }));
    notification.updateMany.mockResolvedValue({ count: 0 });
    notification.findFirst.mockResolvedValue({ id: 'notification-1', userId: 'user-1', readAt: new Date() });
    await expect(service.markRead('notification-1', 'user-1')).resolves.toBeTruthy();
    notification.findFirst.mockResolvedValue(null);
    await expect(service.markRead('notification-1', 'other')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks all unread notifications for the current owner', async () => {
    notification.updateMany.mockResolvedValue({ count: 3 });
    await expect(service.markAllRead('user-1')).resolves.toEqual({ success: true });
    expect(notification.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1', readAt: null } }));
  });

  it('returns the existing record when a dedupe key conflicts', async () => {
    notification.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '6.19.0' }));
    notification.findUnique.mockResolvedValue({ id: 'existing', dedupeKey: 'LEAD_WON:lead-1' });
    await expect(service.create({ userId: 'user-1', type: 'LEAD_WON', title: 'Lead ganado', dedupeKey: 'LEAD_WON:lead-1' })).resolves.toEqual(expect.objectContaining({ id: 'existing' }));
    expect(notification.findUnique).toHaveBeenCalledWith({ where: { dedupeKey: 'LEAD_WON:lead-1' } });
  });
});
