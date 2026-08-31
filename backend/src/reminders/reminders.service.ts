import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateReminderDto, UpdateReminderDto } from './dto/reminder.dto';
import type { QueryRemindersDto } from './dto/query-reminders.dto';

const reminderInclude = { lead: { select: { id: true, name: true, company: true } } } as const;

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryRemindersDto, userId: string) {
    const now = new Date();
    const dayStart = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const where: Prisma.ReminderWhereInput = { userId };
    if (query.leadId) where.leadId = query.leadId;
    if (query.status === 'pending') where.completedAt = null;
    if (query.status === 'completed') where.completedAt = { not: null };
    if (query.range === 'today') where.dueAt = { gte: dayStart, lt: dayEnd };
    if (query.range === 'upcoming') where.dueAt = { gte: dayEnd };
    if (query.range === 'overdue') { where.dueAt = { lt: now }; where.completedAt = null; }
    return this.prisma.reminder.findMany({ where, include: reminderInclude, orderBy: [{ completedAt: 'asc' }, { dueAt: 'asc' }] });
  }

  async create(dto: CreateReminderDto, userId: string) {
    await this.ensureLead(dto.leadId);
    return this.prisma.reminder.create({ data: { title: dto.title.trim(), description: dto.description?.trim() || null, dueAt: new Date(dto.dueAt), leadId: dto.leadId ?? null, userId }, include: reminderInclude });
  }

  async update(id: string, dto: UpdateReminderDto, userId: string) {
    await this.ensureOwned(id, userId);
    await this.ensureLead(dto.leadId);
    return this.prisma.reminder.update({ where: { id }, data: { title: dto.title?.trim(), description: dto.description === undefined ? undefined : dto.description?.trim() || null, dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined, completedAt: dto.completedAt === undefined ? undefined : dto.completedAt ? new Date(dto.completedAt) : null, leadId: dto.leadId === undefined ? undefined : dto.leadId, }, include: reminderInclude });
  }

  async remove(id: string, userId: string) {
    await this.ensureOwned(id, userId);
    await this.prisma.reminder.delete({ where: { id } });
    return { success: true };
  }

  private async ensureOwned(id: string, userId: string) {
    const reminder = await this.prisma.reminder.findFirst({ where: { id, userId }, select: { id: true } });
    if (!reminder) throw new NotFoundException('Recordatorio no encontrado.');
  }

  private async ensureLead(leadId?: string | null) {
    if (!leadId) return;
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
    if (!lead) throw new NotFoundException('Lead no encontrado.');
  }
}
