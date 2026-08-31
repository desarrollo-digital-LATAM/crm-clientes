import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Prisma, LeadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { CreatePublicLeadDto } from './dto/public-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { CreateLeadActivityDto } from './dto/activity.dto';
import { NotificationsService } from '../notifications/notifications.service';

const assignedUserSelect = { id: true, name: true, email: true } as const;
const leadInclude = { assignedUser: { select: assignedUserSelect }, client: { select: { id: true } } } as const;
const pipelineSelect = { id: true, name: true, company: true, serviceInterest: true, status: true, nextFollowUpAt: true, createdAt: true, assignedUser: { select: assignedUserSelect } } as const;
const sortableFields = ['createdAt', 'updatedAt', 'name', 'nextFollowUpAt', 'status'] as const;

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService, private readonly notifications?: NotificationsService) {}

  async create(dto: CreateLeadDto, currentUser: AuthenticatedUser) {
    const assignedUserId = dto.assignedUserId ?? currentUser.id;
    await this.ensureAssignedUser(assignedUserId);

    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        company: dto.company,
        email: dto.email,
        phone: dto.phone,
        serviceInterest: dto.serviceInterest,
        message: dto.message,
        source: dto.source ?? 'MANUAL',
        status: dto.status ?? LeadStatus.NEW,
        estimatedBudget: this.toDecimal(dto.estimatedBudget),
        notes: dto.notes,
        nextFollowUpAt: dto.nextFollowUpAt,
        lastContactAt: dto.lastContactAt,
        assignedUserId,
      },
      include: leadInclude,
    });

    await this.notifySafely({ userId: assignedUserId, type: 'NEW_LEAD', title: 'Nuevo Lead recibido', message: `Se creó el Lead ${lead.name}.`, href: `/leads/${lead.id}`, dedupeKey: `NEW_LEAD:${lead.id}` });
    return this.serializeLead(lead);
  }

  async createPublic(dto: CreatePublicLeadDto) {
    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        company: dto.company,
        email: dto.email,
        phone: dto.phone,
        serviceInterest: dto.serviceInterest,
        message: dto.message,
        source: 'WEBSITE',
        status: LeadStatus.NEW,
        estimatedBudget: this.toDecimal(dto.estimatedBudget),
        notes: null,
        nextFollowUpAt: null,
        lastContactAt: null,
        assignedUserId: null,
      },
      include: leadInclude,
    });

    return this.serializeLead(lead);
  }

  async findAll(query: QueryLeadsDto) {
    const where: Prisma.LeadWhereInput = {
      status: query.status,
      source: query.source ? { equals: query.source, mode: 'insensitive' } : undefined,
      serviceInterest: query.serviceInterest ? { contains: query.serviceInterest, mode: 'insensitive' } : undefined,
      assignedUserId: query.assignedUserId,
      ...(query.search ? {
        OR: ['name', 'company', 'email', 'phone'].map((field) => ({ [field]: { contains: query.search, mode: 'insensitive' } })),
      } : {}),
    };
    const sortBy = sortableFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
    const skip = (query.page - 1) * query.limit;
    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({ where, include: leadInclude, orderBy: { [sortBy]: query.sortOrder }, skip, take: query.limit }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads.map((lead) => this.serializeLead(lead)),
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async findPipeline(query: Pick<QueryLeadsDto, 'search' | 'source' | 'serviceInterest'>) {
    const where: Prisma.LeadWhereInput = {
      source: query.source ? { equals: query.source, mode: 'insensitive' } : undefined,
      serviceInterest: query.serviceInterest ? { contains: query.serviceInterest, mode: 'insensitive' } : undefined,
      ...(query.search ? { OR: ['name', 'company', 'email', 'phone'].map((field) => ({ [field]: { contains: query.search, mode: 'insensitive' } })) } : {}),
    };
    const leads = await this.prisma.lead.findMany({
      where,
      select: pipelineSelect,
      orderBy: [{ nextFollowUpAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
      take: 1000,
    });
    return Object.fromEntries(Object.values(LeadStatus).map((status) => [status, leads.filter((lead) => lead.status === status)]));
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, include: leadInclude });
    if (!lead) throw new NotFoundException('Lead no encontrado.');
    return this.serializeLead(lead);
  }

  async update(id: string, dto: UpdateLeadDto, currentUser: AuthenticatedUser) {
    const current = await this.prisma.lead.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Lead no encontrado.');

    const email = dto.email === undefined ? current.email : dto.email;
    const phone = dto.phone === undefined ? current.phone : dto.phone;
    if (!email && !phone) throw new BadRequestException('El lead debe conservar un correo electrónico o un teléfono.');
    if (dto.assignedUserId) await this.ensureAssignedUser(dto.assignedUserId);

    const data: Prisma.LeadUpdateInput = {
      name: dto.name,
      company: dto.company,
      email: dto.email,
      phone: dto.phone,
      serviceInterest: dto.serviceInterest,
      message: dto.message,
      source: dto.source,
      status: dto.status,
      estimatedBudget: dto.estimatedBudget === undefined ? undefined : this.toDecimal(dto.estimatedBudget),
      notes: dto.notes,
      nextFollowUpAt: dto.nextFollowUpAt,
      lastContactAt: dto.lastContactAt,
      assignedUser: dto.assignedUserId === null
        ? { disconnect: true }
        : dto.assignedUserId
          ? { connect: { id: dto.assignedUserId } }
          : undefined,
    };
    const nextStatus = dto.status;
    const lead = nextStatus !== undefined && nextStatus !== current.status
      ? await this.prisma.$transaction(async (tx) => {
        const updated = await tx.lead.update({ where: { id }, data, include: leadInclude });
        await tx.leadActivity.create({
          data: { leadId: id, userId: currentUser.id, type: ActivityType.STATUS_CHANGE, description: `Estado cambiado de ${this.statusLabel(current.status)} a ${this.statusLabel(nextStatus)}` },
        });
        return updated;
      })
      : await this.prisma.lead.update({ where: { id }, data, include: leadInclude });
    if (dto.assignedUserId && dto.assignedUserId !== current.assignedUserId) {
      await this.notifySafely({ userId: dto.assignedUserId, type: 'LEAD_ASSIGNED', title: 'Te asignaron un Lead', message: `${lead.name} requiere tu atención.`, href: `/leads/${lead.id}`, dedupeKey: `LEAD_ASSIGNED:${lead.id}:${dto.assignedUserId}` });
    }
    if (nextStatus === LeadStatus.WON && current.status !== LeadStatus.WON && lead.assignedUserId) {
      await this.notifySafely({ userId: lead.assignedUserId, type: 'LEAD_WON', title: 'Lead ganado', message: `${lead.name} pasó a estado Ganado.`, href: `/leads/${lead.id}`, dedupeKey: `LEAD_WON:${lead.id}` });
    }
    return this.serializeLead(lead);
  }

  async findActivities(leadId: string) {
    await this.requireLead(leadId);
    const activities = await this.prisma.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return { data: activities };
  }

  async createActivity(leadId: string, dto: CreateLeadActivityDto, currentUser: AuthenticatedUser) {
    await this.requireLead(leadId);
    if (dto.type === ActivityType.STATUS_CHANGE) throw new BadRequestException('Los cambios de estado se registran automáticamente.');
    const isContact = dto.type === ActivityType.CALL || dto.type === ActivityType.WHATSAPP || dto.type === ActivityType.EMAIL || dto.type === ActivityType.MEETING;
    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.leadActivity.create({
        data: { leadId, userId: currentUser.id, type: dto.type, description: dto.description.trim() },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      if (isContact) await tx.lead.update({ where: { id: leadId }, data: { lastContactAt: new Date() } });
      return activity;
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.lead.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('No se puede eliminar un lead relacionado con otra entidad.');
      }
      throw error;
    }
    return { success: true };
  }

  private async ensureAssignedUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('Usuario responsable no encontrado.');
  }

  private async requireLead(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, select: { id: true } });
    if (!lead) throw new NotFoundException('Lead no encontrado.');
  }

  private statusLabel(status: LeadStatus) {
    return ({ NEW: 'Nuevo', CONTACTED: 'Contactado', QUALIFIED: 'Calificado', PROPOSAL: 'Propuesta', NEGOTIATION: 'Negociación', WON: 'Ganado', LOST: 'Perdido' } as Record<LeadStatus, string>)[status];
  }

  private toDecimal(value: number | null | undefined) {
    return value === undefined || value === null ? value : new Prisma.Decimal(value);
  }

  private async notifySafely(input: Parameters<NotificationsService['create']>[0]) {
    if (!this.notifications) return;
    try { await this.notifications.create(input); } catch (error) { console.error('No se pudo crear una notificación interna.', error); }
  }

  private serializeLead(lead: Prisma.LeadGetPayload<{ include: typeof leadInclude }>) {
    return { ...lead, estimatedBudget: lead.estimatedBudget?.toString() ?? null };
  }
}
