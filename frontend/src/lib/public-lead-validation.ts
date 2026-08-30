import { z } from 'zod';

export const PUBLIC_LEAD_LIMITS = {
  name: 100,
  company: 150,
  email: 254,
  phoneInput: 32,
  serviceInterest: 120,
  estimatedBudget: 999_999_999.99,
  message: 5_000,
  sourceDetail: 80,
} as const;

export function normalizePublicLeadPhone(value: string) {
  const trimmed = value.trim();
  return /^\+?[\d\s()-]+$/.test(trimmed) ? trimmed.replace(/[\s()-]/g, '') : trimmed;
}

function isValidPublicPhone(value: string) {
  const trimmed = value.trim();
  return !trimmed || (trimmed.length <= PUBLIC_LEAD_LIMITS.phoneInput && /^\+?\d{7,15}$/.test(normalizePublicLeadPhone(trimmed)));
}

const fields = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').max(PUBLIC_LEAD_LIMITS.name, `El nombre no puede superar ${PUBLIC_LEAD_LIMITS.name} caracteres.`),
  company: z.string().trim().max(PUBLIC_LEAD_LIMITS.company, `La empresa no puede superar ${PUBLIC_LEAD_LIMITS.company} caracteres.`),
  email: z.string().trim().max(PUBLIC_LEAD_LIMITS.email, `El email no puede superar ${PUBLIC_LEAD_LIMITS.email} caracteres.`).refine((value) => !value || z.email().safeParse(value).success, 'Ingresa un email válido.'),
  phone: z.string().trim().refine(isValidPublicPhone, 'Ingresa un número de teléfono válido.'),
  serviceInterest: z.string().trim().max(PUBLIC_LEAD_LIMITS.serviceInterest, `El servicio no puede superar ${PUBLIC_LEAD_LIMITS.serviceInterest} caracteres.`),
  sourceDetail: z.string().trim().max(PUBLIC_LEAD_LIMITS.sourceDetail, `El origen no puede superar ${PUBLIC_LEAD_LIMITS.sourceDetail} caracteres.`),
  estimatedBudget: z.string().trim().refine((value) => {
    if (!value || !/^\d+(?:\.\d{1,2})?$/.test(value)) return !value;
    const amount = Number(value);
    return Number.isFinite(amount) && amount <= PUBLIC_LEAD_LIMITS.estimatedBudget;
  }, 'Ingresa un presupuesto válido con máximo 2 decimales.'),
  message: z.string().trim().min(10, 'El mensaje debe tener al menos 10 caracteres.').max(PUBLIC_LEAD_LIMITS.message, `El mensaje no puede superar ${PUBLIC_LEAD_LIMITS.message} caracteres.`),
  website: z.string().optional(),
});

export const publicLeadFormSchema = fields.superRefine((data, context) => {
  if (!data.email && !data.phone) {
    context.addIssue({ code: 'custom', path: ['email'], message: 'Debes indicar un correo electrónico o un teléfono.' });
  }
});

export type PublicLeadFormValues = z.infer<typeof publicLeadFormSchema>;