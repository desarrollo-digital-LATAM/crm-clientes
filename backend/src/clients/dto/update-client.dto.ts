import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { LEAD_LIMITS, normalizePhone } from '../../leads/dto/lead.dto';

const trimOrNull = ({ value }: { value: unknown }) => {
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || null;
};
const trimOrUndefined = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() || undefined : value;

const normalizeEmail = ({ value }: { value: unknown }) => {
  const normalized = trimOrNull({ value });
  return typeof normalized === 'string' ? normalized.toLowerCase() : normalized;
};

export class UpdateClientDto {
  @Transform(trimOrUndefined)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(LEAD_LIMITS.name)
  name?: string;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(LEAD_LIMITS.company)
  company?: string | null;

  @Transform(normalizeEmail)
  @IsOptional()
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido.' })
  @MaxLength(LEAD_LIMITS.email)
  email?: string | null;

  @Transform(normalizePhone)
  @IsOptional()
  @IsString()
  @MaxLength(LEAD_LIMITS.phone + 1, { message: 'Ingresa un número de teléfono válido.' })
  @Matches(/^\+?\d{7,15}$/, { message: 'Ingresa un número de teléfono válido.' })
  phone?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(LEAD_LIMITS.notes)
  notes?: string | null;
}
