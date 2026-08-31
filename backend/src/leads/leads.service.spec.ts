import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActivityType, LeadStatus, Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { LeadsService } from './leads.service';

const user = { id: 'user-id', name: 'Ana', email: 'ana@example.com', role: 'MEMBER' as const } satisfies AuthenticatedUser;
const lead = {
  id: 'lead-id', name: 'Acme', company: null, email: 'contact@acme.com', phone: null,
  serviceInterest: null, message: null, source: 'MANUAL', status: LeadStatus.NEW,
  estimatedBudget: null, notes: null, nextFollowUpAt: null, lastContactAt: null,
  assignedUserId: user.id, createdAt: new Date(), updatedAt: new Date(), assignedUser: user,
};

function createService() {
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ id: user.id }) },
    lead: {
      create: jest.fn().mockResolvedValue(lead),
      findMany: jest.fn().mockResolvedValue([lead]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(lead),
      update: jest.fn().mockResolvedValue(lead),
      delete: jest.fn().mockResolvedValue(lead),
    },
    leadActivity: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: 'activity-id', type: ActivityType.NOTE, description: 'Nota', createdAt: new Date(), leadId: lead.id, userId: user.id, user }) },
    $transaction: jest.fn(async (callback: (tx: Prisma.TransactionClient) => unknown) => callback(prisma)),
  } as unknown as PrismaService;
  return { prisma, service: new LeadsService(prisma) };
}

describe('LeadsService', () => {
  it('creates a valid lead assigned to the current user by default', async () => {
    const { prisma, service } = createService();
    const dto = { name: 'Acme', email: 'contact@acme.com' } as CreateLeadDto;

    await service.create(dto, user);

    expect(prisma.lead.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: 'Acme', status: LeadStatus.NEW, source: 'MANUAL', assignedUserId: user.id }),
    }));
  });

  it('returns paginated, searchable and filtered results', async () => {
    const { prisma, service } = createService();
    const query = Object.assign(new QueryLeadsDto(), { page: 2, limit: 10, search: 'acme', status: LeadStatus.NEW, source: 'MANUAL' });

    const result = await service.findAll(query);

    expect(result.pagination).toEqual({ page: 2, limit: 10, total: 1, totalPages: 1 });
    expect(prisma.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10, orderBy: { createdAt: 'desc' }, where: expect.objectContaining({ status: LeadStatus.NEW, source: expect.any(Object), OR: expect.any(Array) }) }));
    expect(result.data[0].estimatedBudget).toBeNull();
  });

  it('returns a limited, grouped pipeline ordered by follow-up', async () => {
    const { service, prisma } = createService();
    const result = await service.findPipeline({ search: 'acme' });
    expect(Object.keys(result)).toEqual(Object.values(LeadStatus));
    expect(result.NEW).toHaveLength(1);
    expect(prisma.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({ select: expect.objectContaining({ id: true, name: true, status: true }), take: 1000 }));
  });

  it('returns 404 when the lead does not exist', async () => {
    const { service, prisma } = createService();
    (prisma.lead.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a lead and rejects removing its last contact method', async () => {
    const { service, prisma } = createService();
    const dto = { status: LeadStatus.CONTACTED } as UpdateLeadDto;

    await service.update(lead.id, dto, user);
    expect(prisma.lead.update).toHaveBeenCalled();

    const clearContact = { email: null, phone: null } as UpdateLeadDto;
    await expect(service.update(lead.id, clearContact, user)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates an activity with the current user and updates last contact only for real contact', async () => {
    const { service, prisma } = createService();
    await service.createActivity(lead.id, { type: ActivityType.CALL, description: 'Llamada' }, user);
    expect(prisma.leadActivity.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: user.id, type: ActivityType.CALL }) }));
    expect(prisma.lead.update).toHaveBeenCalledWith(expect.objectContaining({ data: { lastContactAt: expect.any(Date) } }));
    (prisma.lead.update as jest.Mock).mockClear();
    await service.createActivity(lead.id, { type: ActivityType.NOTE, description: 'Nota' }, user);
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  it('lists activities newest first and creates an automatic status activity', async () => {
    const { service, prisma } = createService();
    await service.findActivities(lead.id);
    expect(prisma.leadActivity.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { createdAt: 'desc' } }));
    await service.update(lead.id, { status: LeadStatus.CONTACTED }, user);
    expect(prisma.leadActivity.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: ActivityType.STATUS_CHANGE, userId: user.id, description: 'Estado cambiado de Nuevo a Contactado' }) }));
  });

  it('does not create a duplicate status activity when status is unchanged', async () => {
    const { service, prisma } = createService();
    await service.update(lead.id, { status: LeadStatus.NEW }, user);
    expect(prisma.leadActivity.create).not.toHaveBeenCalled();
  });

  it('returns 404 for activity operations when the lead is missing', async () => {
    const { service, prisma } = createService();
    (prisma.lead.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.findActivities('missing-id')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.createActivity('missing-id', { type: ActivityType.NOTE, description: 'Nota' }, user)).rejects.toBeInstanceOf(NotFoundException);
  });
});
