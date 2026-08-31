'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { fetchLeads } from '../../lib/api/leads';
import { fetchClients } from '../../lib/api/clients';
import type { Lead } from '../../types/leads';
import type { Client } from '../../types/clients';

export type MentionEntity = { type: 'LEAD' | 'CLIENT'; id: string; name: string; company: string | null; leadId: string };

type Props = { value: string; selected: MentionEntity | null; onChange: (value: string) => void; onSelect: (entity: MentionEntity) => void; onClear: () => void };

export function EntityMentionInput({ value, selected, onChange, onSelect, onClear }: Props) {
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [active, setActive] = useState(0);
  const requestSequence = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const mention = value.match(/(^|\s)@([^\s@]*)$/);
  const mentionTerm = mention?.[2];

  useEffect(() => {
    if (mentionTerm === undefined) return;
    const nextTerm = mentionTerm;
    const timer = window.setTimeout(async () => {
      const sequence = ++requestSequence.current;
      setLoading(true);
      try {
        const [leadResponse, clientResponse] = await Promise.all([
          fetchLeads({ page: 1, limit: 5, search: nextTerm }),
          fetchClients({ page: 1, limit: 5, search: nextTerm }),
        ]);
        if (sequence === requestSequence.current) {
          setLeads(leadResponse.data);
          setClients(clientResponse.data);
          setActive(0);
        }
      } finally { if (sequence === requestSequence.current) setLoading(false); }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [mentionTerm]);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setFocused(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const options: MentionEntity[] = [
    ...leads.map((lead) => ({ type: 'LEAD' as const, id: lead.id, name: lead.name, company: lead.company, leadId: lead.id })),
    ...clients.map((client) => ({ type: 'CLIENT' as const, id: client.id, name: client.name, company: client.company, leadId: client.sourceLeadId })),
  ];
  const choose = (entity: MentionEntity) => {
    const nextValue = mention ? `${value.slice(0, mention.index!)}${value.slice(mention.index!).replace(/@[^\s@]*$/, entity.name)}` : value;
    onChange(nextValue);
    onSelect(entity);
    setFocused(false);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (focused && mention && options.length) {
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => (index + 1) % options.length); return; }
      if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => (index - 1 + options.length) % options.length); return; }
      if (event.key === 'Enter') { event.preventDefault(); choose(options[active]); return; }
    }
    if (event.key === 'Escape') setFocused(false);
  };

  const open = focused && Boolean(mention);
  const leadOptions = options.filter((entity) => entity.type === 'LEAD');
  const clientOptions = options.filter((entity) => entity.type === 'CLIENT');
  const renderOptions = (items: MentionEntity[]) => items.map((entity) => { const index = options.findIndex((option) => option.type === entity.type && option.id === entity.id); return <button type="button" role="option" aria-selected={index === active} id={`${listId}-${entity.type}-${entity.id}`} key={`${entity.type}-${entity.id}`} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(entity)} className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm ${index === active ? 'bg-[var(--muted)]' : 'hover:bg-[var(--muted)]'}`}><span className="min-w-0 truncate"><strong>{entity.name}</strong>{entity.company && <span className="ml-2 text-xs text-[var(--muted-foreground)]">{entity.company}</span>}</span><span className="shrink-0 rounded-full bg-[var(--muted)] px-2 py-0.5 text-[11px] text-[var(--muted-foreground)]">{entity.type === 'LEAD' ? 'Lead' : 'Cliente'}</span></button>; });
  return <div ref={rootRef} className="relative min-w-0 flex-1"><input value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} onFocus={() => setFocused(true)} placeholder="Escribe un recordatorio y usa @ para vincular un contacto" role="combobox" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && options[active] ? `${listId}-${options[active].type}-${options[active].id}` : undefined} className="h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15" />{selected && <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[var(--muted)] px-3 py-2 text-xs"><span className="truncate">Vinculado a: <strong>{selected.name}</strong> · {selected.type === 'LEAD' ? 'Lead' : 'Cliente'}</span><button type="button" onClick={onClear} aria-label="Quitar vínculo" className="rounded-full p-0.5 hover:bg-[var(--surface)]"><X size={14} /></button></div>}{open && <div id={listId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2 shadow-lg">{loading && options.length === 0 && <p className="px-2 py-1 text-xs text-[var(--muted-foreground)]">Buscando...</p>}{options.length ? <>{leadOptions.length > 0 && <><p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Leads</p>{renderOptions(leadOptions)}</>}{clientOptions.length > 0 && <><p className="mt-2 px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Clientes</p>{renderOptions(clientOptions)}</>}</> : !loading && <div className="flex items-center gap-2 p-3 text-sm text-[var(--muted-foreground)]"><Search size={15} />No encontramos Leads o Clientes.</div>}{loading && options.length > 0 && <p className="px-2 py-1 text-[11px] text-[var(--muted-foreground)]">Actualizando...</p>}</div>}</div>;
}
