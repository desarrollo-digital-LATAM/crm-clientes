import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SupabaseAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { SupabaseAuthService } from './supabase-auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseAuthService, SupabaseAuthGuard],
})
export class AuthModule {}
