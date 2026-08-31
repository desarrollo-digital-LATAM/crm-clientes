'use client';

import { DndContext, DragOverlay, PointerSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { CalendarClock, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { LEAD_STATUSES, STATUS_META, type LeadStatus, type PipelineLead, type PipelineResponse } from '../../types/leads';

const dateFormatter = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' });

export function LeadPipeline({ data, onMove }: { data: PipelineResponse; onMove: (id: string, status: LeadStatus, previousStatus: LeadStatus) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [active, setActive] = useState<PipelineLead>();
  function end(event: DragEndEvent) {
    setActive(undefined);
    const target = event.over?.id as LeadStatus | undefined;
    if (target && active && target !== active.status) onMove(active.id, target, active.status);
  }
  return <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(event) => setActive(event.active.data.current?.lead)} onDragEnd={end} onDragCancel={() => setActive(undefined)}>
    <div className="crm-scrollbar overflow-x-auto pb-3"><div className="flex min-w-max gap-4">
      {LEAD_STATUSES.map((status) => <PipelineColumn key={status} status={status} leads={data[status] || []} />)}
    </div></div>
    <DragOverlay>{active ? <LeadCard lead={active} overlay /> : null}</DragOverlay>
  </DndContext>;
}

function PipelineColumn({ status, leads }: { status: LeadStatus; leads: PipelineLead[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  const meta = STATUS_META[status];
  return <section ref={setNodeRef} className={`w-[312px] shrink-0 rounded-xl border bg-[var(--surface-secondary)] p-3 transition-colors ${isOver ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/20' : 'border-[var(--border-subtle)]'}`} aria-label={`${meta.label}, ${leads.length} leads`}>
    <header className="mb-3 flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${meta.className.split(' ')[0]}`} /><h2 className="text-sm font-semibold">{meta.label}</h2></div><span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">{leads.length}</span></header>
    <div className="min-h-24 space-y-2">{leads.length ? leads.map((lead) => <LeadCard key={lead.id} lead={lead} />) : <p className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-[var(--border)] px-3 py-5 text-center text-xs text-[var(--muted-foreground)]">Sin leads</p>}</div>
  </section>;
}

function LeadCard({ lead, overlay = false }: { lead: PipelineLead; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id, data: { lead } });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return <Link ref={setNodeRef} href={`/leads/${lead.id}`} style={style} {...listeners} {...attributes} onClick={(event) => { if (isDragging) event.preventDefault(); }} className={`block cursor-grab rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3.5 transition-[border-color,background-color,box-shadow,opacity] hover:border-[var(--primary)]/50 hover:bg-[var(--surface)] active:cursor-grabbing ${overlay ? 'scale-[1.01] shadow-md' : ''} ${isDragging ? 'opacity-45' : ''}`}>
    <p className="truncate text-[13px] font-semibold" title={lead.name}>{lead.name}</p>
    {lead.company && <p className="mt-1 truncate text-[13px] text-[var(--muted-foreground)]">{lead.company}</p>}
    {lead.serviceInterest && <p className="mt-2 truncate text-xs text-[var(--muted-foreground)]">{lead.serviceInterest}</p>}
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5 text-xs text-[var(--muted-foreground)]"><span className={followUpClass(lead.nextFollowUpAt)}><CalendarClock size={13} />{formatFollowUp(lead.nextFollowUpAt)}</span><span className="flex min-w-0 items-center gap-1 truncate" title={lead.assignedUser?.email}><UserRound size={13} />{lead.assignedUser?.name || lead.assignedUser?.email || 'Sin asignar'}</span></div>
  </Link>;
}

function formatFollowUp(value: string | null) { if (!value) return 'Sin seguimiento'; const date = new Date(value); const today = new Date(); today.setHours(0, 0, 0, 0); date.setHours(0, 0, 0, 0); if (date < today) return 'Vencido'; if (date.getTime() === today.getTime()) return 'Hoy'; return dateFormatter.format(date); }
function followUpClass(value: string | null) { if (!value) return 'flex items-center gap-1'; const date = new Date(value); const today = new Date(); date.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0); return `${date <= today ? 'text-[var(--warning)]' : 'text-[var(--muted-foreground)]'} flex items-center gap-1`; }
