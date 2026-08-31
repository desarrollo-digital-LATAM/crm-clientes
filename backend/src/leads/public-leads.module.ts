import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PublicLeadsController } from './public-leads.controller';
import { LeadsModule } from './leads.module';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 600_000, limit: 5 }]), LeadsModule],
  controllers: [PublicLeadsController],
})
export class PublicLeadsModule {}
