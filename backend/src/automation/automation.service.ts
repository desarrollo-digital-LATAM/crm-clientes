import { Injectable } from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type RecommendationType = 'NO_FOLLOW_UP' | 'OVERDUE_FOLLOW_UP' | 'STALE_CONTACT' | 'UNASSIGNED' | 'WON_NOT_CONVERTED';
export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecommendationAction = 'SCHEDULE_FOLLOW_UP' | 'ASSIGN_OWNER' | 'OPEN_LEAD' | 'CONVERT_CLIENT' | 'RESCHEDULE_FOLLOW_UP';

type Recommendation = { type: RecommendationType; priority: RecommendationPriority; leadId: string; leadName: string; message: string; action: RecommendationAction; relevantAt: Date };

@Injectable()
export class AutomationService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecommendations() {
    const now = new Date();
    const leads = await this.prisma.lead.findMany({
      where: { OR: [{ status: { notIn: [LeadStatus.WON, LeadStatus.LOST] } }, { status: LeadStatus.WON, client: { is: null } }] },
      select: { id: true, name: true, status: true, nextFollowUpAt: true, lastContactAt: true, assignedUserId: true, createdAt: true, updatedAt: true, client: { select: { id: true } } },
    });
    const items: Recommendation[] = [];
    for (const lead of leads) {
      if (lead.status === LeadStatus.WON && !lead.client) {
        items.push({ type: 'WON_NOT_CONVERTED', priority: 'HIGH', leadId: lead.id, leadName: lead.name, message: 'Lead ganado pendiente de convertir en cliente.', action: 'CONVERT_CLIENT', relevantAt: lead.updatedAt });
        continue;
      }
      if (lead.status !== LeadStatus.WON && lead.status !== LeadStatus.LOST && lead.nextFollowUpAt && lead.nextFollowUpAt < now) {
        items.push({ type: 'OVERDUE_FOLLOW_UP', priority: 'HIGH', leadId: lead.id, leadName: lead.name, message: 'Seguimiento vencido.', action: 'RESCHEDULE_FOLLOW_UP', relevantAt: lead.nextFollowUpAt });
      } else if (!lead.nextFollowUpAt && lead.status === LeadStatus.NEW) {
        items.push({ type: 'NO_FOLLOW_UP', priority: 'MEDIUM', leadId: lead.id, leadName: lead.name, message: 'Programa un primer seguimiento.', action: 'SCHEDULE_FOLLOW_UP', relevantAt: lead.createdAt });
      } else if (!lead.nextFollowUpAt && lead.status === LeadStatus.CONTACTED) {
        items.push({ type: 'NO_FOLLOW_UP', priority: 'MEDIUM', leadId: lead.id, leadName: lead.name, message: 'Programa el siguiente contacto.', action: 'SCHEDULE_FOLLOW_UP', relevantAt: lead.lastContactAt ?? lead.createdAt });
      }
      if (lead.status !== LeadStatus.WON && lead.status !== LeadStatus.LOST && lead.lastContactAt && lead.lastContactAt < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        items.push({ type: 'STALE_CONTACT', priority: 'MEDIUM', leadId: lead.id, leadName: lead.name, message: 'Han pasado 7 días desde el último contacto.', action: 'OPEN_LEAD', relevantAt: lead.lastContactAt });
      }
       if (!lead.assignedUserId) items.push({ type: 'UNASSIGNED', priority: 'MEDIUM', leadId: lead.id, leadName: lead.name, message: 'Lead sin responsable.', action: 'ASSIGN_OWNER', relevantAt: lead.createdAt });
    }
    const priority = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    items.sort((a, b) => priority[a.priority] - priority[b.priority] || a.relevantAt.getTime() - b.relevantAt.getTime());
    return { summary: { total: items.length, high: items.filter((item) => item.priority === 'HIGH').length, medium: items.filter((item) => item.priority === 'MEDIUM').length }, items: items.map((item) => ({ type: item.type, priority: item.priority, leadId: item.leadId, leadName: item.leadName, message: item.message, action: item.action })) };
  }
}
