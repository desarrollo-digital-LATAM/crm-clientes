import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RemindersModule } from './reminders/reminders.module';

describe('application module wiring', () => {
  it('resolves auth guards in users and reminders modules', async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, UsersModule, RemindersModule],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });
});
