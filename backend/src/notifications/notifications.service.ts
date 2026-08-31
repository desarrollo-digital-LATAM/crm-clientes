import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { QueryNotificationsDto } from './dto/query-notifications.dto';

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message?: string;
  href?: string;
  dedupeKey?: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    try {
      return await this.prisma.notification.create({ data: { ...input, message: input.message ?? null, href: input.href ?? null, dedupeKey: input.dedupeKey ?? null } });
    } catch (error) {
      if (input.dedupeKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.prisma.notification.findUnique({ where: { dedupeKey: input.dedupeKey } });
      }
      throw error;
    }
  }

  async findAll(query: QueryNotificationsDto, userId: string) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.filter === 'unread') where.readAt = null;
    if (query.filter === 'read') where.readAt = { not: null };
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: query.limit }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } }).then((count) => ({ count }));
  }

  async markRead(id: string, userId: string) {
    const result = await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    if (!result.count) {
      const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
      if (!notification) throw new NotFoundException('Notificación no encontrada.');
      return notification;
    }
    return this.prisma.notification.findFirst({ where: { id, userId } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { success: true };
  }
}
