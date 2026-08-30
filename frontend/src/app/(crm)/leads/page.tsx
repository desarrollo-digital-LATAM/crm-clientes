'use client';

import { Plus, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLead, deleteLead, fetchLeads, updateLead, type LeadQuery } from '../../../lib/api/leads';
import type { Lead, LeadPayload } from '../../../types/leads';
import { LeadFilters } from '../../../components/leads/lead-filters';
import { LeadForm } from '../../../components/leads/lead-form';
import { LeadTable } from '../../../components/leads/lead-table';

const initialQuery: LeadQuery = { page: 1, limit: 20 };

export default function LeadsPage() {
  const [query, setQuery] = useState<LeadQuery>(initialQuery);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead>();
  const [notice, setNotice] = useState<string>();
  const queryClient = useQueryClient();
  useEffect(() => { const timer = setTimeout(() => queryClient.invalidateQueries({ queryKey: ['leads'] }), 350); return () => clearTimeout(timer); }, [query.search, queryClient]);
  const leads = useQuery({ queryKey: ['leads', query], queryFn: () => fetchLeads(query) });
  const mutation = useMutation({ mutationFn: ({ id, payload }: { id?: string; payload: LeadPayload }) => id ? updateLead(id, payload) : createLead(payload), onSuccess: async (_, variables) => { setFormOpen(false); setEditing(undefined); setNotice(variables.id ? 'Lead actualizado.' : 'Lead creado.'); await queryClient.invalidateQueries({ queryKey: ['leads'] }); }, onError: () => setNotice('No pudimos conectar con el servidor. Intenta nuevamente.') });
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: Lead['status'] }) => updateLead(id, { status }), onSuccess: async () => { setNotice('Estado actualizado.'); await queryClient.invalidateQueries({ queryKey: ['leads'] }); }, onError: () => setNotice('No pudimos actualizar el estado. Intenta nuevamente.') });
  const removeMutation = useMutation({ mutationFn: deleteLead, onSuccess: async () => { setNotice('Lead eliminado.'); await queryClient.invalidateQueries({ queryKey: ['leads'] }); }, onError: () => setNotice('No pudimos eliminar el lead. Intenta nuevamente.') });
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(undefined), 3000); return () => clearTimeout(timer); }, [notice]);
  function changeQuery(change: Partial<LeadQuery>) { setQuery((current) => ({ ...current, ...change })); }
  function submit(payload: LeadPayload) { mutation.mutate({ id: editing?.id, payload }); }
  function remove(lead: Lead) { if (window.confirm('¿Eliminar este lead? Esta acción no se puede deshacer.')) removeMutation.mutate(lead.id); }
  function openNew() { setEditing(undefined); setFormOpen(true); }

  return (
    <section className="mx-auto max-w-[1480px]">
      <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-[var(--primary)]">Pipeline comercial</p><h1 className="mt-1 text-[26px] font-semibold tracking-tight">Leads</h1><p className="mt-2 text-[15px] text-[var(--muted-foreground)]">Gestiona tus oportunidades comerciales y próximos contactos.</p></div>
        <button type="button" onClick={openNew} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[var(--primary-hover)]"><Plus size={17} />Nuevo lead</button>
      </div>
      <LeadFilters query={query} onChange={changeQuery} />
      {notice && <div className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--success)]" role="status">{notice}</div>}
      {leads.isLoading ? <TableSkeleton /> : leads.isError ? <div className="mt-7 border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center"><p className="text-[15px] font-medium">No pudimos cargar los leads.</p><button type="button" onClick={() => leads.refetch()} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-medium"><RefreshCw size={15} />Reintentar</button></div> : leads.data?.data.length ? <div className="mt-7"><LeadTable leads={leads.data.data} {...leads.data.pagination} onPage={(page) => changeQuery({ page })} onEdit={(lead) => { setEditing(lead); setFormOpen(true); }} onStatus={(lead, status) => statusMutation.mutate({ id: lead.id, status })} onDelete={remove} /></div> : <div className="mt-7 border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center"><p className="text-[15px] font-medium">{leads.data?.pagination.total ? 'No encontramos leads con estos filtros.' : 'No hay leads todavía'}</p><p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">{leads.data?.pagination.total ? 'Prueba con otros criterios de búsqueda.' : 'Crea tu primer lead para comenzar a gestionar el pipeline.'}</p>{!leads.data?.pagination.total && <button type="button" onClick={openNew} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white"><Plus size={16} />Crear lead</button>}</div>}
      {formOpen && <LeadForm lead={editing} onClose={() => { setFormOpen(false); setEditing(undefined); }} onSubmit={submit} loading={mutation.isPending} />}
    </section>
  );
}

function TableSkeleton() { return <div className="mt-7 overflow-hidden border border-[var(--border)] bg-[var(--surface)]"><div className="h-12 border-b border-[var(--border)] bg-[var(--surface-secondary)]" />{Array.from({ length: 6 }).map((_, index) => <div key={index} className="flex gap-4 border-b border-[var(--border)] px-4 py-5"><div className="h-4 w-40 animate-pulse rounded bg-[var(--muted)]" /><div className="h-4 w-28 animate-pulse rounded bg-[var(--muted)]" /><div className="h-4 w-24 animate-pulse rounded bg-[var(--muted)]" /></div>)}</div>; }
