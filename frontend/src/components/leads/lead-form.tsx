'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { InputHTMLAttributes } from 'react';
import { editLeadFormSchema, LEAD_LIMITS, newLeadFormSchema, normalizeLeadPhone, type LeadFormValues } from '../../lib/lead-validation';
import type { Lead, LeadPayload } from '../../types/leads';
import { LEAD_STATUSES, STATUS_META } from '../../types/leads';

const emptyValues: LeadFormValues = { name: '', company: '', email: '', phone: '', serviceInterest: '', source: 'MANUAL', status: 'NEW', estimatedBudget: '', nextFollowUpAt: '', notes: '' };
function toInputDate(value: string | null) { return value ? value.slice(0, 16) : ''; }
function toValues(lead?: Lead): LeadFormValues {
  if (!lead) return emptyValues;
  return { name: lead.name, company: lead.company || '', email: lead.email || '', phone: lead.phone || '', serviceInterest: lead.serviceInterest || '', source: lead.source || 'MANUAL', status: lead.status, estimatedBudget: lead.estimatedBudget || '', nextFollowUpAt: toInputDate(lead.nextFollowUpAt), notes: lead.notes || '' };
}

function startOfTodayInput() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00`;
}

export function LeadForm({ lead, onClose, onSubmit, loading }: { lead?: Lead; onClose: () => void; onSubmit: (payload: LeadPayload) => void; loading: boolean }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadFormValues>({ resolver: zodResolver(lead ? editLeadFormSchema : newLeadFormSchema), defaultValues: toValues(lead) });
  useEffect(() => reset(toValues(lead)), [lead, reset]);
  function submit(values: LeadFormValues) {
    onSubmit({ name: values.name, company: values.company || null, email: values.email ? values.email.toLowerCase() : null, phone: values.phone ? normalizeLeadPhone(values.phone) : null, serviceInterest: values.serviceInterest || null, source: values.source || 'MANUAL', status: values.status, estimatedBudget: values.estimatedBudget ? Number(values.estimatedBudget) : null, nextFollowUpAt: values.nextFollowUpAt ? new Date(values.nextFollowUpAt).toISOString() : null, notes: values.notes || null });
  }
  const field = (name: keyof LeadFormValues, label: string, options: InputHTMLAttributes<HTMLInputElement> & { required?: boolean } = {}) => {
    const { required, ...inputProps } = options;
    return (
      <label className="block text-sm font-medium">
        {label}{required && ' *'}
        <input {...register(name)} {...inputProps} aria-required={required || undefined} className="mt-2 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:border-[var(--primary)]" />
        {errors[name] && <span className="mt-1 block text-sm text-[var(--danger)]">{errors[name]?.message}</span>}
      </label>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40"
      role="presentation"
      onClick={onClose}
      onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}
    >
      <div
        className="flex h-full w-full max-w-xl flex-col bg-[var(--surface)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--border)] px-6 py-6">
          <div><h2 id="lead-form-title" className="text-xl font-semibold">{lead ? 'Editar lead' : 'Nuevo lead'}</h2><p className="mt-1.5 text-sm text-[var(--muted-foreground)]">Los campos marcados son necesarios.</p></div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)]" aria-label="Cerrar formulario"><X size={19} /></button>
        </div>
        <form onSubmit={handleSubmit(submit)} noValidate className="flex-1 space-y-7 overflow-y-auto px-6 py-7">
          <div className="grid gap-5 sm:grid-cols-2">{field('name', 'Nombre', { type: 'text', required: true, maxLength: LEAD_LIMITS.name })}{field('company', 'Empresa', { type: 'text', maxLength: LEAD_LIMITS.company })}{field('email', 'Email', { type: 'email', maxLength: LEAD_LIMITS.email, autoCapitalize: 'none' })}{field('phone', 'Teléfono', { type: 'tel', inputMode: 'tel', maxLength: LEAD_LIMITS.phoneInput })}</div>
          <p className="-mt-3 text-sm text-[var(--muted-foreground)]">Debes indicar un email o un teléfono.</p>
          <div className="grid gap-5 sm:grid-cols-2">{field('serviceInterest', 'Servicio', { type: 'text', maxLength: LEAD_LIMITS.serviceInterest })}{field('source', 'Origen', { type: 'text', maxLength: LEAD_LIMITS.source })}{field('estimatedBudget', 'Presupuesto estimado', { type: 'number', min: 0, max: LEAD_LIMITS.estimatedBudget, step: 0.01 })}{field('nextFollowUpAt', 'Próximo seguimiento', { type: 'datetime-local', min: lead ? undefined : startOfTodayInput() })}</div>
          <label className="block text-sm font-medium">Estado<select {...register('status')} className="mt-2 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)]">{LEAD_STATUSES.map((status) => <option key={status} value={status}>{STATUS_META[status].label}</option>)}</select></label>
          <label className="block text-sm font-medium">Notas<textarea {...register('notes')} rows={4} maxLength={LEAD_LIMITS.notes} className="mt-2 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" />{errors.notes && <span className="mt-1 block text-sm text-[var(--danger)]">{errors.notes.message}</span>}</label>
          <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-6">
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[var(--border)] px-4 text-sm font-medium hover:bg-[var(--muted)]">Cancelar</button>
            <button type="submit" disabled={loading} className="h-10 rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-60">{loading ? 'Guardando...' : lead ? 'Guardar cambios' : 'Crear lead'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
