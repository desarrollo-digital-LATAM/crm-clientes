import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RemindersModule } from './reminders/reminders.module';
import { LeadsModule } from './leads/leads.module';
import { PublicLeadsModule } from './leads/public-leads.module';
import { NotificationsModule } from './notifications/notifications.module';

describe('application module wiring', () => {
  it('resolves the public leads and notifications graph', async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, UsersModule, RemindersModule, NotificationsModule, LeadsModule, PublicLeadsModule],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });
});
