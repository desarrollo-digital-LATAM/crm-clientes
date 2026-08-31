'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Lead } from '../../types/leads';
import { STATUS_META } from '../../types/leads';

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const columnWidths: Record<string, string> = {
  name: 'w-[210px]',
  company: 'w-[145px]',
  contact: 'w-[145px]',
  serviceInterest: 'w-[175px]',
  source: 'w-[120px]',
  status: 'w-[135px]',
  assigned: 'w-[155px]',
  nextFollowUpAt: 'w-[150px]',
  createdAt: 'w-[125px]',
  actions: 'w-[52px]',
};

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha';
  return dateFormatter.format(new Date(value));
}

function formatSource(value: string) {
  if (value === 'WEBSITE') return 'Sitio web';
  if (value === 'MANUAL') return 'Manual';
  return value;
}

function followUpState(value: string | null) {
  if (!value) return null;
  const followUp = new Date(value);
  const today = new Date();
  followUp.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (followUp < today) return 'overdue';
  if (followUp.getTime() === today.getTime()) return 'today';
  return null;
}

export function LeadTable({ leads, page, totalPages, total, onPage, onEdit, onStatus, onDelete }: { leads: Lead[]; page: number; totalPages: number; total: number; onPage: (page: number) => void; onEdit: (lead: Lead) => void; onStatus: (lead: Lead, status: Lead['status']) => void; onDelete: (lead: Lead) => void }) {
  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'name',
      header: 'Lead',
      cell: ({ row }) => <div className="min-w-0"><Link href={`/leads/${row.original.id}`} className="block truncate font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--primary)] hover:underline" title={row.original.name}>{row.original.name}</Link><p className="mt-0.5 truncate text-[13px] text-[var(--muted-foreground)]" title={row.original.email || undefined}>{row.original.email || 'Sin email'}</p></div>,
    },
    {
      accessorKey: 'company',
      header: 'Empresa',
      cell: ({ getValue }) => <TruncatedText value={getValue<string | null>()} />,
    },
    {
      id: 'contact',
      header: 'Contacto',
      cell: ({ row }) => <TruncatedText value={row.original.phone} muted />,
    },
    {
      accessorKey: 'serviceInterest',
      header: 'Servicio',
      cell: ({ getValue }) => <TruncatedText value={getValue<string | null>()} />,
    },
    {
      accessorKey: 'source',
      header: 'Origen',
      cell: ({ getValue }) => <TruncatedText value={formatSource(getValue<string>())} muted />,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <select aria-label={`Estado de ${row.original.name}`} value={row.original.status} onChange={(event) => onStatus(row.original, event.target.value as Lead['status'])} className={`${STATUS_META[row.original.status].className} max-w-full appearance-none rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none`}>{Object.entries(STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select>,
    },
    {
      id: 'assigned',
      header: 'Responsable',
      cell: ({ row }) => {
        const responsible = row.original.assignedUser?.name || row.original.assignedUser?.email;
        return <TruncatedText value={responsible || 'Sin asignar'} title={row.original.assignedUser?.email} />;
      },
    },
    {
      accessorKey: 'nextFollowUpAt',
      header: 'Seguimiento',
      cell: ({ getValue }) => <FollowUp value={getValue<string | null>()} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Creado',
      cell: ({ getValue }) => <span className="whitespace-nowrap text-[13px] text-[var(--muted-foreground)]">{formatDate(getValue<string>())}</span>,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => <RowActions lead={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];

  // TanStack Table owns internal functions that React Compiler cannot memoize safely.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: leads, columns, getCoreRowModel: getCoreRowModel(), manualPagination: true });

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1360px] table-fixed text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            {table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} className={`${columnWidths[header.column.id] || ''} whitespace-nowrap px-3.5 py-3 font-semibold last:px-2`}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {table.getRowModel().rows.map((row) => <tr key={row.id} className="h-14 transition-colors hover:bg-[var(--surface-secondary)]">{row.getVisibleCells().map((cell) => <td key={cell.id} className={`${columnWidths[cell.column.id] || ''} px-3.5 py-2.5 align-middle last:px-2`}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
        <span>{total} {total === 1 ? 'lead' : 'leads'}</span>
        <div className="flex items-center gap-3">
          <span>Página {page} de {Math.max(totalPages, 1)}</span>
          <div className="flex items-center gap-1.5">
            <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] transition-colors hover:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-40" aria-label="Página anterior"><ChevronLeft size={16} /></button>
            <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] transition-colors hover:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-40" aria-label="Página siguiente"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TruncatedText({ value, muted = false, title }: { value: string | null; muted?: boolean; title?: string }) {
  return <span className={`block truncate ${muted ? 'text-[13px] text-[var(--muted-foreground)]' : ''}`} title={title || value || undefined}>{value || '—'}</span>;
}

function FollowUp({ value }: { value: string | null }) {
  const state = followUpState(value);
  return <div className="flex items-center gap-2 whitespace-nowrap text-[13px]"><span>{formatDate(value)}</span>{state && <span className={`h-2 w-2 shrink-0 rounded-full ${state === 'overdue' ? 'bg-[var(--danger)]' : 'bg-[var(--warning)]'}`} aria-label={state === 'overdue' ? 'Seguimiento vencido' : 'Seguimiento para hoy'} title={state === 'overdue' ? 'Vencido' : 'Hoy'} />}</div>;
}

function RowActions({ lead, onEdit, onDelete }: { lead: Lead; onEdit: (lead: Lead) => void; onDelete: (lead: Lead) => void }) {
  const itemClass = 'flex cursor-default select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-[var(--muted)]';
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] data-[state=open]:bg-[var(--muted)] data-[state=open]:text-[var(--foreground)]" aria-label="Acciones del lead"><MoreHorizontal size={18} /></button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content side="bottom" align="end" sideOffset={6} collisionPadding={8} className="z-50 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 text-[var(--foreground)] shadow-md">
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href={`/leads/${lead.id}`}><Eye size={15} />Ver detalle</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemClass} onSelect={() => onEdit(lead)}><Pencil size={15} />Editar</DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
          <DropdownMenu.Item className={`${itemClass} text-[var(--danger)] data-[highlighted]:bg-red-500/10`} onSelect={() => onDelete(lead)}><Trash2 size={15} />Eliminar</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
