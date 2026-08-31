import { ConflictException, NotFoundException } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from './clients.service';
import { QueryClientsDto } from './dto/query-clients.dto';

const user = { id: 'user-id', name: 'Ana', email: 'ana@example.com', role: 'MEMBER' as const } satisfies AuthenticatedUser;
const lead = { id: 'lead-id', name: 'Acme', company: 'Acme SAC', email: 'contact@acme.com', phone: '+51999999999', status: LeadStatus.WON };
const client = { id: 'client-id', name: lead.name, company: lead.company, email: lead.email, phone: lead.phone, notes: null, sourceLeadId: lead.id, convertedAt: new Date(), createdAt: new Date(), updatedAt: new Date(), sourceLead: { id: lead.id, status: LeadStatus.WON, source: 'WEBSITE', createdAt: new Date() } };

function createService() {
  const prisma = {
    lead: { findUnique: jest.fn().mockResolvedValue(lead) },
    client: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(client), findMany: jest.fn().mockResolvedValue([client]), count: jest.fn().mockResolvedValue(1), update: jest.fn().mockResolvedValue(client) },
    leadActivity: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(async (callback: (tx: Prisma.TransactionClient) => unknown) => callback(prisma)),
  } as unknown as PrismaService;
  return { prisma, service: new ClientsService(prisma) };
}

describe('ClientsService', () => {
  it('converts only a WON lead and preserves its source relation', async () => {
    const { service, prisma } = createService();
    const result = await service.convertLead(lead.id, user);
    expect(result).toEqual(client);
    expect(prisma.client.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: lead.name, sourceLeadId: lead.id, notes: null }) }));
    expect(prisma.leadActivity.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ description: 'Lead convertido en cliente.' }) }));
  });

  it('rejects missing, non-WON and already converted leads', async () => {
    const missing = createService();
    (missing.prisma.lead.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(missing.service.convertLead('missing', user)).rejects.toBeInstanceOf(NotFoundException);
    const pending = createService();
    (pending.prisma.lead.findUnique as jest.Mock).mockResolvedValue({ ...lead, status: LeadStatus.PROPOSAL });
    await expect(pending.service.convertLead(lead.id, user)).rejects.toBeInstanceOf(ConflictException);
    const duplicate = createService();
    (duplicate.prisma.client.findUnique as jest.Mock).mockResolvedValue(client);
    await expect(duplicate.service.convertLead(lead.id, user)).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps a unique conflict caused by concurrent conversion to 409', async () => {
    const { service, prisma } = createService();
    (prisma.client.create as jest.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '6.19.0' }));
    await expect(service.convertLead(lead.id, user)).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns paginated clients with the default converted date ordering', async () => {
    const { service, prisma } = createService();
    const result = await service.findAll(Object.assign(new QueryClientsDto(), { page: 2, limit: 10 }));
    expect(result.pagination).toEqual({ page: 2, limit: 10, total: 1, totalPages: 1 });
    expect(prisma.client.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10, orderBy: { convertedAt: 'desc' } }));
  });
});
