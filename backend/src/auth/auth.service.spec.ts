import { UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { INVALID_CREDENTIALS_MESSAGE } from './auth.constants';
import { AuthService } from './auth.service';
import { hashPassword } from './password';

const publicUser = { id: 'user-id', name: 'Ana', email: 'ana@example.com', role: 'MEMBER' as const };

describe('AuthService', () => {
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword('CorrectPassword!');
  });

  function setup(user: Record<string, unknown> | null = { ...publicUser, passwordHash, active: true }) {
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue(user) },
      session: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as unknown as PrismaService;
    return { prisma, service: new AuthService(prisma) };
  }

  it('logs in a valid active user and stores only the session token hash', async () => {
    const { prisma, service } = setup();

    const result = await service.login(' ANA@example.com ', 'CorrectPassword!');

    expect(result.user).toEqual(publicUser);
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { email: { equals: 'ana@example.com', mode: 'insensitive' } } });
    const createData = (prisma.session.create as jest.Mock).mock.calls[0][0].data;
    expect(createData.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(createData.tokenHash).not.toBe(result.token);
    expect(createData.userId).toBe(publicUser.id);
  });

  it('rejects a wrong password with the generic message', async () => {
    const { service } = setup();
    await expect(service.login(publicUser.email, 'WrongPassword!')).rejects.toMatchObject({
      constructor: UnauthorizedException,
      message: INVALID_CREDENTIALS_MESSAGE,
    });
  });

  it('rejects an unknown email with the same generic message', async () => {
    const { service } = setup(null);
    await expect(service.login('missing@example.com', 'WrongPassword!')).rejects.toMatchObject({
      constructor: UnauthorizedException,
      message: INVALID_CREDENTIALS_MESSAGE,
    });
  });

  it('rejects an inactive user', async () => {
    const { service } = setup({ ...publicUser, passwordHash, active: false });
    await expect(service.login(publicUser.email, 'CorrectPassword!')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('authenticates a valid unexpired session', async () => {
    const { prisma, service } = setup();
    (prisma.session.findUnique as jest.Mock).mockResolvedValue({
      id: 'session-id',
      expiresAt: new Date(Date.now() + 60_000),
      user: { ...publicUser, active: true },
    });

    await expect(service.authenticateSession('session-token')).resolves.toEqual(publicUser);
  });

  it('rejects and removes an expired session', async () => {
    const { prisma, service } = setup();
    (prisma.session.findUnique as jest.Mock).mockResolvedValue({
      id: 'expired-id',
      expiresAt: new Date(Date.now() - 1),
      user: { ...publicUser, active: true },
    });

    await expect(service.authenticateSession('expired-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { id: 'expired-id' } });
  });

  it('rejects requests without a matching session', async () => {
    const { prisma, service } = setup();
    (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.authenticateSession('invalid-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revokes the matching session and keeps logout idempotent', async () => {
    const { prisma, service } = setup();
    await expect(service.logout('session-token')).resolves.toEqual({ success: true });
    await expect(service.logout()).resolves.toEqual({ success: true });
    expect(prisma.session.deleteMany).toHaveBeenCalledTimes(1);
  });
});
