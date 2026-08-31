import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [AuthModule, ClientsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
