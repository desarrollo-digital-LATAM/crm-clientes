"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClientForm } from "../../../../components/clients/client-form";
import {
  clientKeys,
  fetchClient,
  updateClient,
} from "../../../../lib/api/clients";
import { ApiError } from "../../../../lib/api/client";
import type { ClientPayload } from "../../../../types/clients";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
function date(value: string) {
  return dateFormatter.format(new Date(value));
}

export default function ClientDetailPage() {
  const params = useParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const query = useQuery({
    queryKey: clientKeys.detail(id || "invalid"),
    queryFn: () =>
      id
        ? fetchClient(id)
        : Promise.reject(new ApiError("Cliente inválido.", 404)),
    enabled: Boolean(id),
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: (payload: ClientPayload) => updateClient(id!, payload),
    onSuccess: async (client) => {
      queryClient.setQueryData(clientKeys.detail(id!), client);
      await queryClient.invalidateQueries({ queryKey: clientKeys.all });
      setEditing(false);
    },
  });
  if (!id || (query.error instanceof ApiError && query.error.status === 404))
    return <Empty message="Cliente no encontrado." />;
  if (query.isPending) return <DetailSkeleton />;
  if (query.isError || !query.data)
    return (
      <Empty
        message="No pudimos cargar este cliente."
        retry={() => query.refetch()}
      />
    );
  const client = query.data;
  return (
    <section className="mx-auto max-w-5xl">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft size={16} />
        Volver a Clientes
      </Link>
      <div className="mt-6 flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-[var(--primary)]">Cliente</p>
          <h1 className="mt-1 text-2xl font-semibold">{client.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {client.company || "Sin empresa"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-medium hover:bg-[var(--muted)]"
        >
          <Pencil size={15} />
          Editar
        </button>
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Información
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Info label="Nombre" value={client.name} />
            <Info label="Empresa" value={client.company} />
            <Info
              label="Email"
              value={client.email}
              link={client.email ? `mailto:${client.email}` : undefined}
            />
            <Info
              label="Teléfono"
              value={client.phone}
              link={client.phone ? `tel:${client.phone}` : undefined}
            />
          </div>
          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <Info label="Notas" value={client.notes} />
          </div>
        </section>
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Origen comercial
          </h2>
          <p className="mt-5 text-sm text-[var(--muted-foreground)]">
            Convertido el {date(client.convertedAt)}
          </p>
          <Link
            href={`/leads/${client.sourceLeadId}`}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]"
          >
            <ExternalLink size={16} />
            Ver lead de origen
          </Link>
        </section>
      </div>
      {mutation.isError && (
        <p className="mt-4 text-sm text-[var(--danger)]">
          No pudimos actualizar el cliente.
        </p>
      )}
      {editing && (
        <ClientForm
          client={client}
          loading={mutation.isPending}
          onClose={() => setEditing(false)}
          onSubmit={(payload) => mutation.mutate(payload)}
        />
      )}
    </section>
  );
}
function Info({
  label,
  value,
  link,
}: {
  label: string;
  value?: string | null;
  link?: string;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      {link ? (
        <a
          href={link}
          className="mt-1 block break-words text-sm font-medium text-[var(--primary)] hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1 break-words text-sm font-medium">{value || "-"}</p>
      )}
    </div>
  );
}
function DetailSkeleton() {
  return (
    <div
      className="mx-auto max-w-5xl space-y-6"
      aria-busy="true"
      aria-hidden="true"
    >
      <div className="h-4 w-28 animate-pulse rounded bg-[var(--muted)]" />
      <div className="h-24 animate-pulse rounded-xl bg-[var(--surface-secondary)]" />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-64 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
        <div className="h-64 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
    </div>
  );
}
function Empty({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
      <p className="font-medium">{message}</p>
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-medium"
        >
          <RefreshCw size={15} />
          Reintentar
        </button>
      ) : (
        <Link
          href="/clientes"
          className="mt-5 inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-4 text-sm font-medium"
        >
          Volver a Clientes
        </Link>
      )}
    </div>
  );
}
