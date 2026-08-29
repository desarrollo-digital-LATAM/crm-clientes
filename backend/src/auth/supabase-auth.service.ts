import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthService {
  private readonly client;

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_PUBLISHABLE_KEY') ?? config.get<string>('SUPABASE_ANON_KEY');

    if (!url || !key) {
      throw new InternalServerErrorException('La configuración de Supabase no está completa.');
    }

    this.client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async verifyAccessToken(token: string): Promise<SupabaseUser> {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Token inválido o expirado.');
    return data.user;
  }
}
