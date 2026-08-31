import { LeadStatus } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

function createService() {
  const prisma = {
    lead: {
      count: jest.fn().mockResolvedValue(10),
      groupBy: jest.fn()
        .mockResolvedValueOnce([{ status: LeadStatus.NEW, _count: { _all: 3 } }])
        .mockResolvedValueOnce([{ source: 'WEBSITE', _count: { _all: 4 } }])
        .mockResolvedValueOnce([{ serviceInterest: null, _count: { _all: 2 } }]),
      findMany: jest.fn().mockResolvedValue([{ id: 'lead-id', name: 'Lead', company: null, status: LeadStatus.NEW, nextFollowUpAt: new Date(Date.now() + 86400000) }]),
    },
    client: { count: jest.fn().mockResolvedValue(2) },
    leadActivity: { findMany: jest.fn().mockResolvedValue([]) },
  } as unknown as PrismaService;
  return { prisma, service: new DashboardService(prisma) };
}

describe('DashboardService', () => {
  it('returns totals, statuses, conversion and grouped data', async () => {
    const { service, prisma } = createService();
    const summary = await service.getSummary();
    expect(summary.leads.total).toBe(10);
    expect(summary.leads.NEW).toBe(3);
    expect(summary.leads.WON).toBe(0);
    expect(summary.clients.total).toBe(2);
    expect(summary.conversion.rate).toBe(20);
    expect(summary.bySource).toEqual([{ source: 'WEBSITE', count: 4 }]);
    expect(summary.byService).toEqual([{ service: 'Sin especificar', count: 2 }]);
    expect(prisma.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10, orderBy: { nextFollowUpAt: 'asc' } }));
  });

  it('uses zero conversion for an empty lead base', async () => {
    const { service, prisma } = createService();
    (prisma.lead.count as jest.Mock).mockResolvedValue(0);
    (prisma.client.count as jest.Mock).mockResolvedValue(0);
    expect((await service.getSummary()).conversion.rate).toBe(0);
  });
});
