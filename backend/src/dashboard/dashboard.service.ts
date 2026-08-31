import { Injectable } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const CLOSED_STATUSES = [LeadStatus.WON, LeadStatus.LOST];
const STATUS_ORDER = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.PROPOSAL, LeadStatus.NEGOTIATION, LeadStatus.WON, LeadStatus.LOST] as const;

function peruDayBounds(date: Date) {
  const peruNow = new Date(date.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  const start = new Date(Date.UTC(peruNow.getFullYear(), peruNow.getMonth(), peruNow.getDate(), 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const offsetMinutes = Math.round((date.getTime() - peruNow.getTime()) / 60000);
  return { start: new Date(start.getTime() + offsetMinutes * 60000), end: new Date(end.getTime() + offsetMinutes * 60000) };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const day = peruDayBounds(now);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const pendingWhere: Prisma.LeadWhereInput = { status: { notIn: CLOSED_STATUSES }, nextFollowUpAt: { not: null } };
    const [total, recent, clients, statusGroups, sourceGroups, serviceGroups] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.client.count(),
      this.prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.lead.groupBy({ by: ['source'], _count: { _all: true }, orderBy: { _count: { source: 'desc' } }, take: 5 }),
      this.prisma.lead.groupBy({ by: ['serviceInterest'], _count: { _all: true }, orderBy: { _count: { serviceInterest: 'desc' } }, take: 5 }),
    ]);
    const [followUpRows, activities, followUps] = await Promise.all([
      this.prisma.lead.findMany({ where: { ...pendingWhere, nextFollowUpAt: { not: null } }, select: { nextFollowUpAt: true } }),
      this.prisma.leadActivity.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, type: true, description: true, createdAt: true, lead: { select: { id: true, name: true } }, user: { select: { id: true, name: true, email: true } } } }),
      this.prisma.lead.findMany({ where: { ...pendingWhere, nextFollowUpAt: { not: null } }, take: 10, orderBy: { nextFollowUpAt: 'asc' }, select: { id: true, name: true, company: true, status: true, nextFollowUpAt: true } }),
    ]);
    const overdue = followUpRows.filter(({ nextFollowUpAt }) => nextFollowUpAt! < now).length;
    const today = followUpRows.filter(({ nextFollowUpAt }) => nextFollowUpAt! >= day.start && nextFollowUpAt! < day.end).length;
    const upcoming = followUpRows.filter(({ nextFollowUpAt }) => nextFollowUpAt! >= day.end).length;
    const statusCounts = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0])) as Record<LeadStatus, number>;
    for (const group of statusGroups) statusCounts[group.status] = group._count._all;
    return {
      leads: { total, new: recent, ...statusCounts },
      clients: { total: clients },
      conversion: { rate: total === 0 ? 0 : Number(((clients / total) * 100).toFixed(1)) },
      followUps: { overdue, today, upcoming },
      bySource: sourceGroups.map((item) => ({ source: item.source?.trim() || 'Sin especificar', count: item._count._all })),
      byService: serviceGroups.map((item) => ({ service: item.serviceInterest?.trim() || 'Sin especificar', count: item._count._all })),
      recentActivities: activities,
      upcomingFollowUps: followUps,
    };
  }
}
