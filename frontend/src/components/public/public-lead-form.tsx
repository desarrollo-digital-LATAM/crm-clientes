'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { publicLeadFormSchema, type PublicLeadFormValues, normalizePublicLeadPhone, PUBLIC_LEAD_LIMITS } from '../../lib/public-lead-validation';
import { apiRequest } from '../../lib/api/client';

const SERVICES = [
  'Desarrollo web',
  'Sistema web',
  'ERP',
  'CRM',
  'SaaS',
  'Automatización',
  'Inteligencia Artificial',
  'Aplicación móvil',
  'Otro',
] as const satisfies readonly string[];

const emptyValues: PublicLeadFormValues = {
  name: '',
  company: '',
  email: '',
  phone: '',
  serviceInterest: '',
  sourceDetail: '',
  estimatedBudget: '',
  message: '',
  website: '',
};

function field(
  name: keyof PublicLeadFormValues,
  label: string,
  options: InputHTMLAttributes<HTMLInputElement> & { required?: boolean } = {},
) {
  const { required, ...inputProps } = options;
  return (
    <label className="block text-sm font-medium">
      {label}{required && ' *'}
      <input {...inputProps} aria-required={required || undefined} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]" />
    </label>
  );
}

function textareaField(
  name: keyof PublicLeadFormValues,
  label: string,
  options: TextareaHTMLAttributes<HTMLTextAreaElement> & { required?: boolean } = {},
) {
  const { required, ...inputProps } = options;
  return (
    <label className="block text-sm font-medium">
      {label}{required && ' *'}
      <textarea {...inputProps} aria-required={required || undefined} className="mt-2 w-full resize-y rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]" />
    </label>
  );
}

function selectField(
  name: keyof PublicLeadFormValues,
  label: string,
  options: readonly string[],
  selectProps: React.SelectHTMLAttributes<HTMLSelectElement> = {},
) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select {...selectProps} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]">
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}

export function PublicLeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PublicLeadFormValues>({
    resolver: zodResolver(publicLeadFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: PublicLeadFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: values.name,
        company: values.company || null,
        email: values.email || null,
        phone: values.phone ? normalizePublicLeadPhone(values.phone) : null,
        serviceInterest: values.serviceInterest || null,
        sourceDetail: values.sourceDetail || null,
        estimatedBudget: values.estimatedBudget ? Number(values.estimatedBudget) : null,
        message: values.message,
        website: values.website || undefined,
      };
      await apiRequest('/public/leads', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSubmitted(true);
      reset();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="max-w-xl mx-auto text-center py-16">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle size={32} />
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-[var(--foreground)]">Gracias por contactarnos</h2>
        <p className="mb-8 text-[var(--muted-foreground)]">Recibimos tu solicitud y nos pondremos en contacto contigo pronto.</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]"
        >
          <Send size={16} />Enviar otra solicitud
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {field('name', 'Nombre', { type: 'text', required: true, maxLength: PUBLIC_LEAD_LIMITS.name })}
        {field('company', 'Empresa', { type: 'text', maxLength: PUBLIC_LEAD_LIMITS.company })}
        {field('email', 'Correo electrónico', { type: 'email', maxLength: PUBLIC_LEAD_LIMITS.email, autoCapitalize: 'none' })}
        {field('phone', 'Teléfono', { type: 'tel', inputMode: 'tel', maxLength: PUBLIC_LEAD_LIMITS.phoneInput })}
        {selectField('serviceInterest', 'Servicio de interés', SERVICES)}
        {field('sourceDetail', '¿Cómo nos conociste?', { type: 'text', maxLength: PUBLIC_LEAD_LIMITS.sourceDetail })}
        {field('estimatedBudget', 'Presupuesto estimado (opcional)', { type: 'number', min: 0, max: PUBLIC_LEAD_LIMITS.estimatedBudget, step: 0.01 })}
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">Debes indicar un correo electrónico o un teléfono.</p>
      {textareaField('message', 'Mensaje', { rows: 5, required: true, maxLength: PUBLIC_LEAD_LIMITS.message })}
      {errors.message && <p className="text-sm text-[var(--danger)]">{errors.message.message}</p>}
      <input type="hidden" {...register('website')} tabIndex={-1} autoComplete="off" />
      {error && (
        <div className="rounded-lg border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)] flex items-center gap-2">
          <AlertCircle size={18} />{error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 size={17} className="animate-spin" />Enviando...
          </>
        ) : (
          <>
            <Send size={17} />Enviar solicitud
          </>
        )}
      </button>
    </form>
  );
}