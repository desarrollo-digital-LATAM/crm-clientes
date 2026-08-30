'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { ACTIVITY_TYPES, type ActivityType } from '../../types/leads';

const labels: Record<typeof ACTIVITY_TYPES[number], string> = { NOTE: 'Nota', CALL: 'Llamada', WHATSAPP: 'WhatsApp', EMAIL: 'Email', MEETING: 'Reunion', FOLLOW_UP: 'Seguimiento' };

export function ActivityForm({ loading, onClose, onSubmit }: { loading: boolean; onClose: () => void; onSubmit: (value: { type: ActivityType; description: string }) => void }) {
  const [type, setType] = useState<typeof ACTIVITY_TYPES[number]>('NOTE');
  const [description, setDescription] = useState('');
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" role="presentation" onClick={onClose} onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
    <div className="flex h-full w-full max-w-md flex-col bg-[var(--surface)] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="activity-form-title" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between border-b border-[var(--border)] px-6 py-6"><div><h2 id="activity-form-title" className="text-xl font-semibold">Registrar actividad</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Deja contexto para el siguiente contacto.</p></div><button type="button" onClick={onClose} aria-label="Cerrar actividad" className="rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"><X size={19} /></button></div>
      <form className="flex-1 space-y-6 px-6 py-7" onSubmit={(event) => { event.preventDefault(); if (description.trim()) onSubmit({ type, description: description.trim() }); }}>
        <label className="block text-sm font-medium">Tipo<select value={type} onChange={(event) => setType(event.target.value as typeof type)} className="mt-2 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm">{ACTIVITY_TYPES.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>
        <label className="block text-sm font-medium">Descripcion<textarea required value={description} onChange={(event) => setDescription(event.target.value)} rows={6} className="mt-2 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" placeholder="Ej. Solicita cotizacion para un CRM." /></label>
        <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-6"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-[var(--border)] px-4 text-sm font-medium hover:bg-[var(--muted)]">Cancelar</button><button type="submit" disabled={loading || !description.trim()} className="h-10 rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Guardando...' : 'Registrar'}</button></div>
      </form>
    </div>
  </div>;
}
