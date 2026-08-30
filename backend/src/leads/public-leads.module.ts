import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PublicLeadsController } from './public-leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 600_000, limit: 5 }])],
  controllers: [PublicLeadsController],
  providers: [LeadsService],
})
export class PublicLeadsModule {}