import { AuthService } from './auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { User as SupabaseUser } from '@supabase/supabase-js';

describe('AuthService', () => {
  it('uses authUserId upsert so repeated logins do not create duplicates', async () => {
    const user = { id: 'local-id', authUserId: 'auth-id', name: 'Ana', email: 'ana@example.com', role: 'MEMBER' as const };
    const prisma = { user: { upsert: jest.fn().mockResolvedValue(user) } } as unknown as PrismaService;
    const service = new AuthService(prisma);
    const authUser = { id: 'auth-id', email: 'ana@example.com', user_metadata: { full_name: 'Ana' } } as unknown as SupabaseUser;

    await service.synchronizeUser(authUser);
    await service.synchronizeUser(authUser);

    expect(prisma.user.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.user.upsert).toHaveBeenLastCalledWith({
      where: { authUserId: 'auth-id' },
      create: { authUserId: 'auth-id', email: 'ana@example.com', name: 'Ana' },
      update: { email: 'ana@example.com', name: 'Ana' },
    });
  });
});
