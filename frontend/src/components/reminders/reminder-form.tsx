'use client';

import { useState } from 'react';
import { EntityMentionInput, type MentionEntity } from './entity-mention-input';

type Props = { initialLeadId?: string; initialLeadName?: string; loading?: boolean; onClose: () => void; onSubmit: (data: { title: string; description?: string; dueAt: string; leadId?: string | null }) => void };

export function ReminderForm({ initialLeadId, initialLeadName, loading, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(initialLeadName ? `Seguimiento de ${initialLeadName}` : '');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [leadId, setLeadId] = useState(initialLeadId ?? '');
  const [selected, setSelected] = useState<MentionEntity | null>(initialLeadId && initialLeadName ? { type: 'LEAD', id: initialLeadId, name: initialLeadName, company: null, leadId: initialLeadId } : null);
  const submit = () => { if (title.trim() && dueAt) onSubmit({ title: title.trim(), description: description.trim() || undefined, dueAt, leadId: leadId || null }); };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5" role="presentation" onClick={onClose}><div className="w-full max-w-lg rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="reminder-form-title" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><h2 id="reminder-form-title" className="text-lg font-semibold">Nuevo recordatorio</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Programa una acción comercial explícita.</p></div><button type="button" onClick={onClose} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cerrar</button></div><div className="mt-5 space-y-4"><EntityMentionInput value={title} selected={selected} onChange={setTitle} onSelect={(entity) => { setSelected(entity); setLeadId(entity.leadId); }} onClear={() => { setSelected(null); setLeadId(''); }} /><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descripción opcional" className="min-h-20 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" /><input aria-label="Fecha y hora del recordatorio" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm" /></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-[var(--border)] px-4 text-sm font-medium">Cancelar</button><button type="button" onClick={submit} disabled={!title.trim() || !dueAt || loading} className="h-10 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Guardando...' : 'Crear recordatorio'}</button></div></div></div>;
}
