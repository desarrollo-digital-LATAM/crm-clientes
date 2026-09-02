import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const user = { id: 'user-id', name: 'Ana', email: 'ana@example.com', role: 'MEMBER' as const };

  it('sets an HttpOnly session cookie and returns only the public profile', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const authService = { login: jest.fn().mockResolvedValue({ user, token: 'plain-token', expiresAt }) } as unknown as AuthService;
    const controller = new AuthController(authService);
    const response = { cookie: jest.fn() } as unknown as Response;

    await expect(controller.login({ email: user.email, password: 'password' }, response)).resolves.toEqual(user);
    expect(response.cookie).toHaveBeenCalledWith('crm_session', 'plain-token', expect.objectContaining({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    }));
  });

  it.each([
    ['ADMIN', 'ADMIN'],
    ['MEMBER', 'MEMBER'],
  ] as const)('returns %s role from /auth/me without secrets', (role, expectedRole) => {
    const currentUser = { ...user, role: role as 'ADMIN' | 'MEMBER' };
    const authService = { toPublicUser: jest.fn().mockReturnValue(currentUser) } as unknown as AuthService;
    expect(new AuthController(authService).me(currentUser)).toEqual(expect.objectContaining({ id: user.id, name: user.name, email: user.email, role: expectedRole }));
    expect(authService.toPublicUser).toHaveBeenCalledWith(currentUser);
  });

  it('revokes the session and clears the cookie on logout', async () => {
    const authService = { logout: jest.fn().mockResolvedValue({ success: true }) } as unknown as AuthService;
    const controller = new AuthController(authService);
    const response = { clearCookie: jest.fn() } as unknown as Response;

    await expect(controller.logout({ cookies: { crm_session: 'plain-token' } } as never, response)).resolves.toEqual({ success: true });
    expect(authService.logout).toHaveBeenCalledWith('plain-token');
    expect(response.clearCookie).toHaveBeenCalledWith('crm_session', expect.objectContaining({ httpOnly: true, path: '/' }));
  });
});
