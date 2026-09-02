"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, LoaderCircle, Plus, Trash2 } from "lucide-react";
import {
  EntityMentionInput,
  type MentionEntity,
} from "../../../components/reminders/entity-mention-input";
import {
  createReminder,
  deleteReminder,
  fetchReminders,
  reminderKeys,
  updateReminder,
} from "../../../lib/api/reminders";
import type { Reminder, ReminderFilters } from "../../../types/reminders";

const tabs: Array<{ label: string; filters: ReminderFilters }> = [
  { label: "Pendientes", filters: { status: "pending" } },
  { label: "Hoy", filters: { status: "pending", range: "today" } },
  { label: "Próximos", filters: { status: "pending", range: "upcoming" } },
  { label: "Vencidos", filters: { status: "pending", range: "overdue" } },
  { label: "Completados", filters: { status: "completed" } },
];

export default function RemindersPage() {
  const [filters, setFilters] = useState<ReminderFilters>(tabs[0].filters);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueAt: "",
    leadId: "",
  });
  const [selectedEntity, setSelectedEntity] = useState<MentionEntity | null>(
    null,
  );
  const [mutationError, setMutationError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const queryKey = reminderKeys.list(filters);
  const query = useQuery({
    queryKey,
    queryFn: () => fetchReminders(filters),
  });
  const mutation = useMutation({
    mutationFn: ({
      id,
      completedAt,
    }: {
      id: string;
      completedAt: string | null;
    }) => updateReminder(id, { completedAt }),
    onMutate: async ({ id, completedAt }) => {
      setMutationError(null);
      await queryClient.cancelQueries({ queryKey: reminderKeys.all });
      const previous = queryClient.getQueriesData<Reminder[]>({
        queryKey: reminderKeys.lists(),
      });
      previous.forEach(([cachedQueryKey, current]) => {
        queryClient.setQueryData(
          cachedQueryKey,
          current?.map((reminder) =>
            reminder.id === id ? { ...reminder, completedAt } : reminder,
          ),
        );
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([cachedQueryKey, previous]) => {
        queryClient.setQueryData(cachedQueryKey, previous);
      });
      setMutationError("No pudimos actualizar el recordatorio. Intenta nuevamente.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reminderKeys.all }),
  });
  const create = useMutation({
    mutationFn: () => createReminder({ ...form, leadId: form.leadId || null }),
    onSuccess: () => {
      setForm({ title: "", description: "", dueAt: "", leadId: "" });
      setSelectedEntity(null);
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
  const remove = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: reminderKeys.all }),
  });

  return (
    <main className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Seguimiento
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Recordatorios
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Organiza tus próximas acciones comerciales.
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:max-w-2xl">
          <EntityMentionInput
            value={form.title}
            selected={selectedEntity}
            onChange={(title) => setForm({ ...form, title })}
            onSelect={(entity) => {
              setSelectedEntity(entity);
              setForm({ ...form, leadId: entity.leadId });
            }}
            onClear={() => {
              setSelectedEntity(null);
              setForm({ ...form, leadId: "" });
            }}
          />
          <input
            aria-label="Fecha y hora"
            type="datetime-local"
            value={form.dueAt}
            onChange={(event) =>
              setForm({ ...form, dueAt: event.target.value })
            }
            className="h-10 min-w-[190px] flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm"
          />
          <button
            type="button"
            disabled={!form.title.trim() || !form.dueAt || create.isPending}
            onClick={() => create.mutate()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus size={16} />
            Nuevo
          </button>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.label}
            onClick={() => setFilters(tab.filters)}
            className={`rounded-full px-3 py-1.5 text-sm ${JSON.stringify(filters) === JSON.stringify(tab.filters) ? "bg-blue-600 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <section className="mt-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
        {mutationError && (
          <p className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700" role="alert">
            {mutationError}
          </p>
        )}
        {query.isPending ? (
          <div className="space-y-3 p-4" aria-busy="true" aria-label="Cargando recordatorios">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] p-3"
                aria-hidden="true"
              >
                <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-[var(--surface-elevated)]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-3/5 animate-pulse rounded bg-[var(--surface-elevated)]" />
                  <div className="h-2.5 w-2/5 animate-pulse rounded bg-[var(--surface-elevated)]" />
                </div>
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-6 text-sm">
            <p>No pudimos cargar tus recordatorios.</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-2 text-blue-600"
            >
              Reintentar
            </button>
          </div>
        ) : query.data?.length ? (
          query.data.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3 last:border-0"
            >
              <button
                type="button"
                aria-label={
                  reminder.completedAt
                    ? "Reabrir recordatorio"
                    : "Completar recordatorio"
                }
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    id: reminder.id,
                    completedAt: reminder.completedAt
                      ? null
                      : new Date().toISOString(),
                  })
                }
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-wait disabled:opacity-70 ${reminder.completedAt ? "border-green-500 bg-green-500 text-white" : "border-[var(--border)] text-transparent hover:border-blue-500"}`}
              >
                {mutation.isPending && mutation.variables?.id === reminder.id ? <LoaderCircle size={15} className="animate-spin text-blue-600" /> : <Check size={15} />}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${reminder.completedAt ? "text-[var(--muted-foreground)] line-through" : ""}`}
                >
                  {reminder.title}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {reminder.lead ? `${reminder.lead.name} · ` : ""}
                  {new Intl.DateTimeFormat("es-PE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(reminder.dueAt))}
                </p>
              </div>
              <button
                type="button"
                aria-label="Eliminar recordatorio"
                onClick={() => remove.mutate(reminder.id)}
                className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <Bell
              className="mx-auto text-[var(--muted-foreground)]"
              size={22}
            />
            <p className="mt-3 text-sm font-medium">
              No tienes recordatorios pendientes.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
