'use client';

import { useEffect, useState } from 'react';
import { fetchActiveUsers, type ActiveUser } from '../../lib/api/users';
import type { Recommendation } from '../../types/dashboard';

type Props = { recommendation: Recommendation; loading?: boolean; error?: string; onClose: () => void; onConfirm: (value: string) => void };

export function RecommendationActionDialog({ recommendation, loading, error, onClose, onConfirm }: Props) {
  const [value, setValue] = useState('');
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const needsOwner = recommendation.action === 'ASSIGN_OWNER';
  useEffect(() => { if (needsOwner) void fetchActiveUsers().then(setUsers); }, [needsOwner]);
  const valid = needsOwner ? Boolean(value) : Boolean(value && new Date(value).getTime() > new Date().getTime());
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5" role="presentation" onClick={onClose}><div className="w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-xl" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><h2 className="text-lg font-semibold">{needsOwner ? 'Asignar responsable' : recommendation.action === 'RESCHEDULE_FOLLOW_UP' ? 'Reprogramar seguimiento' : 'Programar seguimiento'}</h2><p className="mt-2 text-sm text-[var(--muted-foreground)]">{recommendation.message}</p>{needsOwner ? <select value={value} onChange={(event) => setValue(event.target.value)} className="mt-5 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm"><option value="">Selecciona un responsable</option>{users.map((user) => <option value={user.id} key={user.id}>{user.name || user.email} · {user.email}</option>)}</select> : <input aria-label="Fecha y hora del seguimiento" type="datetime-local" value={value} onChange={(event) => setValue(event.target.value)} className="mt-5 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm" />}{error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-[var(--border)] px-4 text-sm">Cancelar</button><button type="button" disabled={!valid || loading} onClick={() => onConfirm(value)} className="h-10 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Guardando...' : needsOwner ? 'Asignar' : 'Guardar'}</button></div></div></div>;
}
