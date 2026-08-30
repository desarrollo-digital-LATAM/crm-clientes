import { Transform, Type } from 'class-transformer';
import { IsEmail, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, Validate, ValidatorConstraint, type ValidationArguments, type ValidatorConstraintInterface } from 'class-validator';

export const PUBLIC_LEAD_LIMITS = {
  name: 100,
  company: 150,
  email: 254,
  phone: 15,
  serviceInterest: 120,
  estimatedBudget: 999_999_999.99,
  message: 5_000,
  sourceDetail: 80,
} as const;

const PHONE_PATTERN = /^\+?\d{7,15}$/;

const trimOrNull = ({ value }: { value: unknown }) => {
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || null;
};

const normalizeEmail = ({ value }: { value: unknown }) => {
  const normalized = trimOrNull({ value });
  return typeof normalized === 'string' ? normalized.toLowerCase() : normalized;
};

const normalizePhone = ({ value }: { value: unknown }) => {
  const normalized = trimOrNull({ value });
  if (typeof normalized !== 'string' || !/^\+?[\d\s()-]+$/.test(normalized)) return normalized;
  return normalized.replace(/[\s()-]/g, '');
};

@ValidatorConstraint({ name: 'hasContact', async: false })
export class PublicHasContactConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const payload = args.object as { email?: string | null; phone?: string | null };
    return Boolean(payload.email || payload.phone);
  }

  defaultMessage() {
    return 'Debes indicar un correo electrónico o un teléfono.';
  }
}

export class CreatePublicLeadDto {
  @Transform(trimOrNull)
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(PUBLIC_LEAD_LIMITS.name, { message: `El nombre no puede superar ${PUBLIC_LEAD_LIMITS.name} caracteres.` })
  @Validate(PublicHasContactConstraint)
  name!: string;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(PUBLIC_LEAD_LIMITS.company, { message: `La empresa no puede superar ${PUBLIC_LEAD_LIMITS.company} caracteres.` })
  company?: string | null;

  @Transform(normalizeEmail)
  @IsOptional()
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido.' })
  @MaxLength(PUBLIC_LEAD_LIMITS.email)
  email?: string | null;

  @Transform(normalizePhone)
  @IsOptional()
  @IsString()
  @MaxLength(PUBLIC_LEAD_LIMITS.phone + 1, { message: 'Ingresa un número de teléfono válido.' })
  @Matches(PHONE_PATTERN, { message: 'Ingresa un número de teléfono válido.' })
  phone?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(PUBLIC_LEAD_LIMITS.serviceInterest, { message: `El servicio no puede superar ${PUBLIC_LEAD_LIMITS.serviceInterest} caracteres.` })
  serviceInterest?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(PUBLIC_LEAD_LIMITS.message, { message: `El mensaje no puede superar ${PUBLIC_LEAD_LIMITS.message} caracteres.` })
  message?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(PUBLIC_LEAD_LIMITS.sourceDetail, { message: `El origen no puede superar ${PUBLIC_LEAD_LIMITS.sourceDetail} caracteres.` })
  sourceDetail?: string | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El presupuesto debe tener máximo 2 decimales.' })
  @Min(0, { message: 'El presupuesto no puede ser negativo.' })
  @Max(PUBLIC_LEAD_LIMITS.estimatedBudget, { message: `El presupuesto no puede superar ${PUBLIC_LEAD_LIMITS.estimatedBudget}.` })
  estimatedBudget?: number | null;

  @IsOptional()
  @IsString()
  website?: string;
}