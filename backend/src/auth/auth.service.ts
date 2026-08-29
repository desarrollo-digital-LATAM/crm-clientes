import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { type User as SupabaseUser } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async synchronizeUser(authUser: SupabaseUser): Promise<AuthenticatedUser> {
    const email = authUser.email;
    if (!email) throw new InternalServerErrorException('El usuario autenticado no tiene correo.');

    const metadata = authUser.user_metadata as Record<string, unknown>;
    const name = this.getName(metadata, email);
    const user = await this.prisma.user.upsert({
      where: { authUserId: authUser.id },
      create: { authUserId: authUser.id, email, name },
      update: { email, name },
    });

    return { id: user.id, authUserId: user.authUserId, name: user.name, email: user.email, role: user.role };
  }

  toPublicUser(user: AuthenticatedUser) {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  private getName(metadata: Record<string, unknown>, email: string) {
    const metadataName = metadata.full_name ?? metadata.name;
    return typeof metadataName === 'string' && metadataName.trim() ? metadataName.trim() : email.split('@')[0];
  }
}
