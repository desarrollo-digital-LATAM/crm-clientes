import { z } from 'zod';
import { LEAD_STATUSES } from '../types/leads';

export const LEAD_LIMITS = {
  name: 100,
  company: 150,
  email: 254,
  phoneInput: 32,
  serviceInterest: 120,
  source: 80,
  estimatedBudget: 999_999_999.99,
  notes: 5_000,
} as const;

export function normalizeLeadPhone(value: string) {
  const trimmed = value.trim();
  return /^\+?[\d\s()-]+$/.test(trimmed) ? trimmed.replace(/[\s()-]/g, '') : trimmed;
}

function isValidPhone(value: string) {
  const trimmed = value.trim();
  return !trimmed || (trimmed.length <= LEAD_LIMITS.phoneInput && /^\+?\d{7,15}$/.test(normalizeLeadPhone(trimmed)));
}

const fields = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').max(LEAD_LIMITS.name, `El nombre no puede superar ${LEAD_LIMITS.name} caracteres.`),
  company: z.string().trim().max(LEAD_LIMITS.company, `La empresa no puede superar ${LEAD_LIMITS.company} caracteres.`),
  email: z.string().trim().max(LEAD_LIMITS.email, `El email no puede superar ${LEAD_LIMITS.email} caracteres.`).refine((value) => !value || z.email().safeParse(value).success, 'Ingresa un email válido.'),
  phone: z.string().trim().refine(isValidPhone, 'Ingresa un número de teléfono válido.'),
  serviceInterest: z.string().trim().max(LEAD_LIMITS.serviceInterest, `El servicio no puede superar ${LEAD_LIMITS.serviceInterest} caracteres.`),
  source: z.string().trim().max(LEAD_LIMITS.source, `El origen no puede superar ${LEAD_LIMITS.source} caracteres.`),
  status: z.enum(LEAD_STATUSES),
  estimatedBudget: z.string().trim().refine((value) => {
    if (!value || !/^\d+(?:\.\d{1,2})?$/.test(value)) return !value;
    const amount = Number(value);
    return Number.isFinite(amount) && amount <= LEAD_LIMITS.estimatedBudget;
  }, 'Ingresa un presupuesto válido con máximo 2 decimales.'),
  nextFollowUpAt: z.string().refine((value) => !value || !Number.isNaN(new Date(value).getTime()), 'Ingresa una fecha válida.'),
  notes: z.string().trim().max(LEAD_LIMITS.notes, `Las notas no pueden superar ${LEAD_LIMITS.notes} caracteres.`),
});

function withContactAndDateRules(allowPastFollowUp: boolean) {
  return fields.superRefine((data, context) => {
    if (!data.email && !data.phone) {
      context.addIssue({ code: 'custom', path: ['email'], message: 'Debes indicar un correo o un teléfono.' });
    }
    if (!allowPastFollowUp && data.nextFollowUpAt) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(data.nextFollowUpAt) < today) {
        context.addIssue({ code: 'custom', path: ['nextFollowUpAt'], message: 'El próximo seguimiento debe ser hoy o una fecha futura.' });
      }
    }
  });
}

export const newLeadFormSchema = withContactAndDateRules(false);
export const editLeadFormSchema = withContactAndDateRules(true);
export type LeadFormValues = z.infer<typeof newLeadFormSchema>;
