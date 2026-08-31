'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Recommendation, RecommendationsResponse } from '../../types/dashboard';

  type Props = { query: UseQueryResult<RecommendationsResponse>; onAction?: (item: Recommendation) => void };

export function RecommendationPanel({ query, onAction }: Props) {
  const data = query.data;
  return <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
    <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold tracking-tight">Acciones sugeridas</h2>{data && data.summary.total > 5 && <Link href="/leads" className="text-xs font-semibold text-[var(--primary)] hover:underline">Ver todas <ArrowRight className="inline" size={13} /></Link>}</div>
    {query.isPending && <div className="mt-5 space-y-3" aria-hidden="true">{[1, 2, 3].map((item) => <div key={item} className="animate-pulse rounded-lg bg-[var(--surface-elevated)] p-3"><div className="h-3 w-3/4 rounded bg-[var(--muted)]" /><div className="mt-2 h-3 w-1/2 rounded bg-[var(--muted)]" /></div>)}</div>}
    {query.isError && <div className="mt-5 text-sm"><p>No pudimos cargar las acciones sugeridas.</p><button type="button" onClick={() => query.refetch()} className="mt-3 text-[var(--primary)] hover:underline">Reintentar</button></div>}
    {!query.isPending && !query.isError && data?.items.length ? <div className="mt-4 divide-y divide-[var(--border)]">{data.items.slice(0, 5).map((item) => <div key={`${item.leadId}-${item.type}`} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className={`text-xs font-semibold ${item.priority === 'HIGH' ? 'text-[var(--danger)]' : item.priority === 'MEDIUM' ? 'text-[var(--warning)]' : 'text-[var(--muted-foreground)]'}`}>{item.priority}</p><p className="mt-1 text-sm font-medium">{item.message}</p><Link href={`/leads/${item.leadId}`} className="mt-1 block truncate text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]">{item.leadName}</Link></div>{item.action === 'OPEN_LEAD' ? <Link href={`/leads/${item.leadId}`} className="shrink-0 text-xs font-semibold text-[var(--primary)] hover:underline">Abrir lead</Link> : <button type="button" onClick={() => onAction?.(item)} className="shrink-0 text-xs font-semibold text-[var(--primary)] hover:underline">{item.action === 'CONVERT_CLIENT' ? 'Convertir' : item.action === 'ASSIGN_OWNER' ? 'Asignar' : item.action === 'RESCHEDULE_FOLLOW_UP' ? 'Reprogramar' : 'Programar'}</button>}</div>)}</div> : !query.isPending && !query.isError && <div className="mt-5 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/10 px-4 py-3"><p className="text-sm font-semibold text-[var(--success)]">Todo al día</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">No hay acciones pendientes.</p></div>}
  </div>;
}
