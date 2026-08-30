'use client';

import { Search, X } from 'lucide-react';
import type { LeadQuery } from '../../lib/api/leads';
import { LEAD_STATUSES, STATUS_META } from '../../types/leads';

const sources = ['MANUAL', 'WEBSITE', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'REFERRAL', 'PHONE', 'OTHER'];
const services = ['Desarrollo web', 'Sistema web', 'ERP', 'CRM', 'SaaS', 'Automatización', 'Inteligencia Artificial', 'Aplicación móvil', 'Otro'];

export function LeadFilters({ query, onChange }: { query: LeadQuery; onChange: (change: Partial<LeadQuery>) => void }) {
  const active = Boolean(query.status || query.source || query.serviceInterest || query.search);
  return (
    <div className="flex flex-col gap-4 border-y border-[var(--border)] py-5 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1 lg:max-w-md">
        <Search size={17} className="absolute left-3 top-3 text-[var(--muted-foreground)]" />
        <input value={query.search || ''} onChange={(event) => onChange({ search: event.target.value || undefined, page: 1 })} placeholder="Buscar leads..." className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)]" />
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={query.status || ''} onChange={(event) => onChange({ status: (event.target.value || undefined) as LeadQuery['status'], page: 1 })} className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)]"><option value="">Estado: Todos</option>{LEAD_STATUSES.map((status) => <option key={status} value={status}>{STATUS_META[status].label}</option>)}</select>
        <select value={query.source || ''} onChange={(event) => onChange({ source: event.target.value || undefined, page: 1 })} className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)]"><option value="">Origen: Todos</option>{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select>
        <select value={query.serviceInterest || ''} onChange={(event) => onChange({ serviceInterest: event.target.value || undefined, page: 1 })} className="h-10 max-w-52 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)]"><option value="">Servicio: Todos</option>{services.map((service) => <option key={service} value={service}>{service}</option>)}</select>
        {active && <button type="button" onClick={() => onChange({ search: undefined, status: undefined, source: undefined, serviceInterest: undefined, page: 1 })} className="inline-flex h-10 items-center gap-1 px-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]" aria-label="Limpiar filtros">Limpiar <X size={15} /></button>}
      </div>
    </div>
  );
}
