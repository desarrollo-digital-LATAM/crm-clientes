import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/auth.guard';
import { RemindersController } from './reminders.controller';

describe('RemindersController', () => {
  it('requires authentication', async () => {
    const authService = { authenticateSession: jest.fn() };
    const guard = new SessionAuthGuard(authService as never);
    const context = { switchToHttp: () => ({ getRequest: () => ({ cookies: {} }) }) } as unknown as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('passes authenticated user to GET and POST', async () => {
    const service = { findAll: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: '1' }) };
    const controller = new RemindersController(service as never);
    await controller.findAll({ status: 'pending' }, { id: 'user-1' } as never);
    await controller.create({ title: 'Reminder', dueAt: '2026-09-01T15:00:00.000Z' }, { id: 'user-1' } as never);
    expect(service.findAll).toHaveBeenCalledWith({ status: 'pending' }, 'user-1');
    expect(service.create).toHaveBeenCalledWith(expect.anything(), 'user-1');
  });
});
