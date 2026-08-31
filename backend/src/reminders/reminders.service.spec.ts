import { NotFoundException } from '@nestjs/common';
import { RemindersService } from './reminders.service';

describe('RemindersService', () => {
  const reminder = { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findFirst: jest.fn() };
  const lead = { findUnique: jest.fn() };
  const service = new RemindersService({ reminder, lead } as never);

  beforeEach(() => jest.clearAllMocks());

  it('filters pending, completed, today, upcoming and overdue reminders by owner', async () => {
    reminder.findMany.mockResolvedValue([]);
    await service.findAll({ status: 'pending' }, 'user-1');
    expect(reminder.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1', completedAt: null } }));
    await service.findAll({ status: 'completed' }, 'user-1');
    expect(reminder.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1', completedAt: { not: null } } }));
    await service.findAll({ status: 'all', range: 'today' }, 'user-1');
    await service.findAll({ status: 'all', range: 'upcoming' }, 'user-1');
    await service.findAll({ status: 'all', range: 'overdue' }, 'user-1');
    expect(reminder.findMany).toHaveBeenCalledTimes(5);
    expect(reminder.findMany.mock.calls[4][0].where).toEqual(expect.objectContaining({ userId: 'user-1', completedAt: null, dueAt: expect.any(Object) }));
  });

  it('creates a valid reminder with a lead relation', async () => {
    lead.findUnique.mockResolvedValue({ id: 'lead-1' });
    reminder.create.mockResolvedValue({ id: 'reminder-1' });
    await service.create({ title: '  Call client  ', description: '  Details  ', dueAt: '2026-09-01T15:00:00.000Z', leadId: 'lead-1' }, 'user-1');
    expect(reminder.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: 'Call client', description: 'Details', leadId: 'lead-1', userId: 'user-1', dueAt: expect.any(Date) }) }));
  });

  it('rejects a missing lead', async () => {
    lead.findUnique.mockResolvedValue(null);
    await expect(service.create({ title: 'Reminder', dueAt: '2026-09-01T15:00:00.000Z', leadId: 'missing' }, 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates and completes/reopens only owned reminders', async () => {
    reminder.findFirst.mockResolvedValue({ id: 'reminder-1' });
    reminder.update.mockResolvedValue({ id: 'reminder-1' });
    await service.update('reminder-1', { completedAt: '2026-09-01T15:00:00.000Z' }, 'user-1');
    await service.update('reminder-1', { completedAt: null }, 'user-1');
    expect(reminder.update).toHaveBeenCalledTimes(2);
    reminder.findFirst.mockResolvedValue(null);
    await expect(service.update('reminder-1', { title: 'Changed' }, 'other')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove('reminder-1', 'other')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes an owned reminder', async () => {
    reminder.findFirst.mockResolvedValue({ id: 'reminder-1' });
    await expect(service.remove('reminder-1', 'user-1')).resolves.toEqual({ success: true });
    expect(reminder.delete).toHaveBeenCalledWith({ where: { id: 'reminder-1' } });
  });
});
