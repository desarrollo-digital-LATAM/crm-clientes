import { LeadStatus } from '@prisma/client';
import { AutomationService } from './automation.service';

describe('AutomationService', () => {
  const findMany = jest.fn();
  const service = new AutomationService({ lead: { findMany } } as never);
  beforeEach(() => findMany.mockReset());
  const lead = (overrides: Partial<Record<string, unknown>> = {}) => ({ id: '1', name: 'Lead', status: LeadStatus.NEW, nextFollowUpAt: null, lastContactAt: null, assignedUserId: 'user', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01'), client: null, ...overrides });

  it('creates NEW and CONTACTED follow-up recommendations', async () => {
    findMany.mockResolvedValue([lead(), lead({ id: '2', status: LeadStatus.CONTACTED })]);
    const result = await service.getRecommendations();
    expect(result.items.map((item) => item.message)).toEqual(['Programa un primer seguimiento.', 'Programa el siguiente contacto.']);
  });
  it('marks overdue as HIGH and excludes WON/LOST overdue', async () => {
    findMany.mockResolvedValue([lead({ nextFollowUpAt: new Date('2020-01-01') }), lead({ id: '2', status: LeadStatus.WON, nextFollowUpAt: new Date('2020-01-01') }), lead({ id: '3', status: LeadStatus.LOST, nextFollowUpAt: new Date('2020-01-01') })]);
    const result = await service.getRecommendations();
    expect(result.items.filter((item) => item.type === 'OVERDUE_FOLLOW_UP')).toHaveLength(1);
    expect(result.items.find((item) => item.type === 'OVERDUE_FOLLOW_UP')?.priority).toBe('HIGH');
    expect(result.items.some((item) => item.type === 'WON_NOT_CONVERTED')).toBe(true);
  });
  it('detects stale contacts and unassigned leads', async () => {
    findMany.mockResolvedValue([lead({ lastContactAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), assignedUserId: null })]);
    const result = await service.getRecommendations();
    expect(result.items.map((item) => item.type)).toEqual(expect.arrayContaining(['NO_FOLLOW_UP', 'STALE_CONTACT', 'UNASSIGNED']));
    expect(result.items).toHaveLength(3);
  });
  it('recommends conversion only for WON without client', async () => {
    findMany.mockResolvedValue([lead({ status: LeadStatus.WON }), lead({ id: '2', status: LeadStatus.WON, client: { id: 'client' } })]);
    const result = await service.getRecommendations();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].action).toBe('CONVERT_CLIENT');
  });
  it('orders HIGH before MEDIUM and performs one query', async () => {
    findMany.mockResolvedValue([lead(), lead({ id: '2', nextFollowUpAt: new Date('2020-01-01') })]);
    const result = await service.getRecommendations();
    expect(result.items[0].priority).toBe('HIGH');
    expect(findMany).toHaveBeenCalledTimes(1);
  });
  it('returns an empty summary', async () => {
    findMany.mockResolvedValue([]);
    await expect(service.getRecommendations()).resolves.toEqual({ summary: { total: 0, high: 0, medium: 0 }, items: [] });
  });
});
