import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from './admin.guard';
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

  it('requires an administrator for administrative operations', async () => {
    const guard = new AdminGuard();
    const memberContext = { switchToHttp: () => ({ getRequest: () => ({ user: { role: 'MEMBER' } }) }) } as unknown as ExecutionContext;
    expect(() => guard.canActivate(memberContext)).toThrow(ForbiddenException);
    const adminContext = { switchToHttp: () => ({ getRequest: () => ({ user: { role: 'ADMIN' } }) }) } as unknown as ExecutionContext;
    expect(guard.canActivate(adminContext)).toBe(true);
  });

  it('applies the session and administrator guards to the controller', () => {
    const guards = Reflect.getMetadata('__guards__', UsersController) as unknown[];
    expect(guards).toContain(SessionAuthGuard);
    expect(Reflect.getMetadata('__guards__', UsersController.prototype.findAll)).toContain(AdminGuard);
  });
});
