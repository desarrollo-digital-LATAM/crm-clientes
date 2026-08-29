import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './auth.guard';
import { SupabaseAuthService } from './supabase-auth.service';

describe('SupabaseAuthGuard', () => {
  it('rejects requests without a bearer token', async () => {
    const guard = new SupabaseAuthGuard(
      {} as SupabaseAuthService,
      {} as AuthService,
    );
    const request = { headers: {} };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validates the token and attaches the synchronized user', async () => {
    const authUser = { id: 'auth-id', email: 'team@example.com', user_metadata: {} };
    const localUser = { id: 'local-id', authUserId: 'auth-id', name: 'team', email: 'team@example.com', role: 'MEMBER' as const };
    const supabaseAuth = { verifyAccessToken: jest.fn().mockResolvedValue(authUser) } as unknown as SupabaseAuthService;
    const authService = { synchronizeUser: jest.fn().mockResolvedValue(localUser) } as unknown as AuthService;
    const guard = new SupabaseAuthGuard(supabaseAuth, authService);
    const request = { headers: { authorization: 'Bearer valid-token' } };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(supabaseAuth.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(request).toHaveProperty('user', localUser);
  });
});
