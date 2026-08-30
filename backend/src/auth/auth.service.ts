import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './auth.types';
import { INVALID_CREDENTIALS_MESSAGE, SESSION_TTL_MS } from './auth.constants';
import { hashPassword, verifyPassword } from './password';

@Injectable()
export class AuthService {
  private readonly dummyHash = hashPassword(randomBytes(32).toString('base64url'));

  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email.trim().toLowerCase(), mode: 'insensitive' } },
    });
    const passwordHash = user?.passwordHash ?? await this.dummyHash;
    const passwordMatches = await verifyPassword(passwordHash, password).catch(() => false);

    if (!user || !user.active || !user.passwordHash || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.prisma.session.create({
      data: { tokenHash: this.hashToken(token), userId: user.id, expiresAt },
    });

    return { user: this.toPublicUser(user), token, expiresAt };
  }

  async authenticateSession(token: string): Promise<AuthenticatedUser> {
    const tokenHash = this.hashToken(token);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) throw new UnauthorizedException('Sesión inválida o expirada.');
    if (session.expiresAt <= new Date() || !session.user.active) {
      await this.prisma.session.deleteMany({ where: { id: session.id } });
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }

    return this.toPublicUser(session.user);
  }

  async logout(token?: string) {
    if (token) {
      await this.prisma.session.deleteMany({ where: { tokenHash: this.hashToken(token) } });
    }
    return { success: true };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  toPublicUser(user: AuthenticatedUser) {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
