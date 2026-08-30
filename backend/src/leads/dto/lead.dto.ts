import { Transform, Type } from 'class-transformer';
import { IsDate, IsEmail, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, Validate, ValidateIf, ValidatorConstraint, type ValidationArguments, type ValidatorConstraintInterface } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export const LEAD_LIMITS = {
  name: 100,
  company: 150,
  email: 254,
  phone: 15,
  serviceInterest: 120,
  source: 80,
  estimatedBudget: 999_999_999.99,
  notes: 5_000,
  message: 5_000,
} as const;

const PHONE_PATTERN = /^\+?\d{7,15}$/;

const trimOrNull = ({ value }: { value: unknown }) => {
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || null;
};

const trimOrUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const normalizeEmail = ({ value }: { value: unknown }) => {
  const normalized = trimOrNull({ value });
  return typeof normalized === 'string' ? normalized.toLowerCase() : normalized;
};

export const normalizePhone = ({ value }: { value: unknown }) => {
  const normalized = trimOrNull({ value });
  if (typeof normalized !== 'string' || !/^\+?[\d\s()-]+$/.test(normalized)) return normalized;
  return normalized.replace(/[\s()-]/g, '');
};

@ValidatorConstraint({ name: 'hasContact', async: false })
export class HasContactConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const payload = args.object as { email?: string | null; phone?: string | null };
    return Boolean(payload.email || payload.phone);
  }

  defaultMessage() {
    return 'Debes indicar un correo o un teléfono.';
  }
}

@ValidatorConstraint({ name: 'isTodayOrFuture', async: false })
export class IsTodayOrFutureConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return value >= today;
  }

  defaultMessage() {
    return 'El próximo seguimiento debe ser hoy o una fecha futura.';
  }
}

export class CreateLeadDto {
  @Transform(trimOrNull)
  @IsString()
  @MinLength(2)
  @MaxLength(LEAD_LIMITS.name)
  @Validate(HasContactConstraint)
  name!: string;

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
  @Matches(PHONE_PATTERN, { message: 'Ingresa un número de teléfono válido.' })
  phone?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(LEAD_LIMITS.serviceInterest)
  serviceInterest?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(LEAD_LIMITS.message)
  message?: string | null;

  @Transform(trimOrUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(LEAD_LIMITS.source)
  source?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(LEAD_LIMITS.estimatedBudget)
  estimatedBudget?: number | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(LEAD_LIMITS.notes)
  notes?: string | null;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  @Validate(IsTodayOrFutureConstraint)
  nextFollowUpAt?: Date | null;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  lastContactAt?: Date | null;

  @Transform(trimOrUndefined)
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;
}

export class UpdateLeadDto {
  @Transform(trimOrUndefined)
  @ValidateIf((_, value) => value !== undefined)
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
  @Matches(PHONE_PATTERN, { message: 'Ingresa un número de teléfono válido.' })
  phone?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(LEAD_LIMITS.serviceInterest)
  serviceInterest?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(LEAD_LIMITS.message)
  message?: string | null;

  @Transform(trimOrUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(LEAD_LIMITS.source)
  source?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(LEAD_LIMITS.estimatedBudget)
  estimatedBudget?: number | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(LEAD_LIMITS.notes)
  notes?: string | null;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  nextFollowUpAt?: Date | null;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  lastContactAt?: Date | null;

  @Transform(({ value }) => value === null ? null : trimOrUndefined({ value }))
  @IsOptional()
  @IsUUID()
  assignedUserId?: string | null;
}
