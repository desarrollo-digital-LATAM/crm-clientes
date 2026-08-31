import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { SessionAuthGuard } from '../auth/auth.guard';

describe('AutomationController auth', () => {
  it('rejects recommendations without a session cookie', async () => {
    const authService = { authenticateSession: jest.fn() };
    const guard = new SessionAuthGuard(authService as never);
    const request = { cookies: {} };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authService.authenticateSession).not.toHaveBeenCalled();
  });

  it('exposes the protected recommendations handler', async () => {
    const getRecommendations = jest.fn().mockResolvedValue({ summary: { total: 0, high: 0, medium: 0 }, items: [] });
    const controller = new AutomationController({ getRecommendations } as never);
    await expect(controller.recommendations()).resolves.toEqual({ summary: { total: 0, high: 0, medium: 0 }, items: [] });
    expect(getRecommendations).toHaveBeenCalledTimes(1);
  });
});
