"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientTable } from "../../../components/clients/client-table";
import { ClientForm } from "../../../components/clients/client-form";
import {
  clientKeys,
  fetchClients,
  updateClient,
  type ClientQuery,
} from "../../../lib/api/clients";
import type { Client, ClientPayload } from "../../../types/clients";

export default function ClientesPage() {
  const [query, setQuery] = useState<ClientQuery>({ page: 1, limit: 20 });
  const [editing, setEditing] = useState<Client>();
  const [notice, setNotice] = useState<string>();
  const queryClient = useQueryClient();
  const clients = useQuery({
    queryKey: clientKeys.list(query),
    queryFn: () => fetchClients(query),
  });
  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClientPayload }) =>
      updateClient(id, payload),
    onSuccess: async () => {
      setEditing(undefined);
      setNotice("Cliente actualizado.");
      await queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
    onError: () => setNotice("No pudimos actualizar el cliente."),
  });
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(undefined), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  return (
    <section className="mx-auto max-w-[1480px]">
      <div className="mb-9">
        <p className="text-sm font-medium text-[var(--primary)]">
          Relaciones comerciales
        </p>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight">
          Clientes
        </h1>
        <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">
          Gestiona las empresas y personas que ya trabajan con nosotros.
        </p>
      </div>
      <div className="flex flex-col gap-4 border-y border-[var(--border)] py-5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search
            size={17}
            className="absolute left-3 top-3 text-[var(--muted-foreground)]"
          />
          <input
            value={query.search || ""}
            onChange={(event) =>
              setQuery({
                ...query,
                search: event.target.value || undefined,
                page: 1,
              })
            }
            placeholder="Buscar clientes..."
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>
      {notice && (
        <div
          className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--success)]"
          role="status"
        >
          {notice}
        </div>
      )}
      {clients.isLoading ? (
        <ClientTableSkeleton />
      ) : clients.isError ? (
        <div className="mt-7 border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
          <p>No pudimos cargar los clientes.</p>
          <button
            type="button"
            onClick={() => clients.refetch()}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-medium"
          >
            <RefreshCw size={15} />
            Reintentar
          </button>
        </div>
      ) : clients.data?.data.length ? (
        <div className="mt-7">
          <ClientTable
            clients={clients.data.data}
            {...clients.data.pagination}
            onPage={(page) => setQuery({ ...query, page })}
            onEdit={setEditing}
          />
        </div>
      ) : (
        <div className="mt-7 border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
          <p className="font-medium">No hay clientes todavía</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Los clientes aparecerán al convertir un lead ganado.
          </p>
        </div>
      )}
      {editing && (
        <ClientForm
          client={editing}
          loading={mutation.isPending}
          onClose={() => setEditing(undefined)}
          onSubmit={(payload) => mutation.mutate({ id: editing.id, payload })}
        />
      )}
    </section>
  );
}

function ClientTableSkeleton() {
  return (
    <div
      className="mt-7 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]"
      aria-busy="true"
      aria-hidden="true"
    >
      <div className="h-12 border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)]" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex gap-4 border-b border-[var(--border-subtle)] px-4 py-4 last:border-0"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-[var(--muted)]" />
          <div className="h-4 w-28 animate-pulse rounded bg-[var(--muted)]" />
          <div className="h-4 w-24 animate-pulse rounded bg-[var(--muted)]" />
        </div>
      ))}
    </div>
  );
}
