import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { LeadsController } from '../leads/leads.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './auth.guard';

describe('SessionAuthGuard', () => {
  it('rejects requests without the session cookie', async () => {
    const guard = new SessionAuthGuard({} as AuthService);
    const request = { cookies: {} };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validates the cookie and attaches currentUser', async () => {
    const user = { id: 'local-id', name: 'Ana', email: 'ana@example.com', role: 'MEMBER' as const };
    const authService = { authenticateSession: jest.fn().mockResolvedValue(user) } as unknown as AuthService;
    const guard = new SessionAuthGuard(authService);
    const request = { cookies: { crm_session: 'valid-token' } };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(authService.authenticateSession).toHaveBeenCalledWith('valid-token');
    expect(request).toHaveProperty('user', user);
  });

  it('protects the Leads controller with the session guard', () => {
    const guards = Reflect.getMetadata('__guards__', LeadsController) as unknown[];
    expect(guards).toContain(SessionAuthGuard);
  });
});
