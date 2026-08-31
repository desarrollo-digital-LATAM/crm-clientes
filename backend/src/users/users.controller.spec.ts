import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/auth.guard';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  it('rejects unauthenticated requests and exposes active users', async () => {
    const authService = { authenticateSession: jest.fn() };
    const guard = new SessionAuthGuard(authService as never);
    const context = { switchToHttp: () => ({ getRequest: () => ({ cookies: {} }) }) } as unknown as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    const findActive = jest.fn().mockResolvedValue([{ id: '1', name: 'User', email: 'user@example.com' }]);
    await expect(new UsersController({ findActive } as never).findActive()).resolves.toEqual([{ id: '1', name: 'User', email: 'user@example.com' }]);
  });
});
