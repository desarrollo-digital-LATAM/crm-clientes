"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Pencil,
  RefreshCw,
  StickyNote,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityForm } from "../../../../components/leads/activity-form";
import { LeadForm } from "../../../../components/leads/lead-form";
import { ApiError } from "../../../../lib/api/client";
import {
  convertLead,
  createLeadActivity,
  fetchLead,
  fetchLeadActivities,
  leadKeys,
  updateLead,
} from "../../../../lib/api/leads";
import { clientKeys } from "../../../../lib/api/clients";
import {
  fetchRecommendations,
  dashboardKeys,
} from "../../../../lib/api/dashboard";
import type { RecommendationsResponse } from "../../../../types/dashboard";
import type {
  ActivityType,
  Lead,
  LeadPayload,
  LeadActivity,
} from "../../../../types/leads";
import { LEAD_STATUSES, STATUS_META } from "../../../../types/leads";
import {
  createReminder,
  fetchReminders,
  reminderKeys,
} from "../../../../lib/api/reminders";
import { ReminderForm } from "../../../../components/reminders/reminder-form";
import { RecommendationActionDialog } from "../../../../components/automation/recommendation-action-dialog";

const dateFormat = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const typeMeta: Record<
  ActivityType,
  { label: string; Icon: typeof StickyNote }
> = {
  NOTE: { label: "Nota", Icon: StickyNote },
  CALL: { label: "Llamada", Icon: Phone },
  WHATSAPP: { label: "WhatsApp", Icon: MessageCircle },
  EMAIL: { label: "Email", Icon: Mail },
  MEETING: { label: "Reunion", Icon: Calendar },
  FOLLOW_UP: { label: "Seguimiento", Icon: Clock },
  STATUS_CHANGE: { label: "Cambio de estado", Icon: ArrowRightLeft },
};

function format(value: string | null) {
  return value ? dateFormat.format(new Date(value)) : "-";
}
function followUpState(value: string | null) {
  if (!value) return "Sin seguimiento programado";
  const date = new Date(value);
  const now = new Date();
  if (date < now) return "Seguimiento atrasado";
  if (date.toDateString() === now.toDateString()) return "Seguimiento para hoy";
  return "Próximo seguimiento";
}

export default function LeadDetailPage() {
  const params = useParams<{ id?: string }>();
  const leadId = typeof params.id === "string" ? params.id : undefined;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<
    RecommendationsResponse["items"][number] | null
  >(null);
  const client = useQueryClient();
  const queryId = leadId ?? "invalid";
  const retryQuery = (_failureCount: number, error: Error) =>
    !(
      error instanceof ApiError && [401, 404, 408].includes(error.status ?? 0)
    ) && _failureCount < 2;
  const leadQuery = useQuery({
    queryKey: leadKeys.detail(queryId),
    queryFn: () =>
      leadId
        ? fetchLead(leadId)
        : Promise.reject(new ApiError("Identificador de lead inválido.", 404)),
    enabled: Boolean(leadId),
    staleTime: 30000,
    retry: retryQuery,
  });
  const activitiesQuery = useQuery({
    queryKey: leadKeys.activities(queryId),
    queryFn: () =>
      leadId
        ? fetchLeadActivities(leadId)
        : Promise.reject(new ApiError("Identificador de lead inválido.", 404)),
    enabled: Boolean(leadId) && leadQuery.isSuccess,
    staleTime: 30000,
    retry: retryQuery,
  });
  const recommendationsQuery = useQuery({
    queryKey: dashboardKeys.recommendations,
    queryFn: fetchRecommendations,
    enabled: Boolean(leadId) && leadQuery.isSuccess,
    staleTime: 45_000,
    retry: 1,
  });
  const remindersQuery = useQuery({
    queryKey: reminderKeys.byLead(queryId),
    queryFn: () => fetchReminders({ status: "all", leadId: queryId }),
    enabled: Boolean(leadId) && leadQuery.isSuccess,
    staleTime: 30_000,
    retry: 1,
  });
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<LeadPayload>) => updateLead(queryId, payload),
    onSuccess: async (lead) => {
      client.setQueryData(leadKeys.detail(queryId), lead);
      await client.invalidateQueries({ queryKey: leadKeys.all });
      await client.invalidateQueries({
        queryKey: leadKeys.activities(queryId),
      });
      await client.invalidateQueries({
        queryKey: dashboardKeys.recommendations,
      });
      setEditing(false);
    },
  });
  const activityMutation = useMutation({
    mutationFn: (payload: { type: ActivityType; description: string }) =>
      createLeadActivity(queryId, payload),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: leadKeys.detail(queryId) }),
        client.invalidateQueries({ queryKey: leadKeys.activities(queryId) }),
        client.invalidateQueries({ queryKey: leadKeys.all }),
        client.invalidateQueries({ queryKey: dashboardKeys.recommendations }),
      ]);
      setActivityOpen(false);
    },
  });
  const convertMutation = useMutation({
    mutationFn: () => convertLead(queryId),
    onSuccess: async (created) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: leadKeys.detail(queryId) }),
        client.invalidateQueries({ queryKey: leadKeys.all }),
        client.invalidateQueries({ queryKey: clientKeys.all }),
        client.invalidateQueries({ queryKey: dashboardKeys.recommendations }),
      ]);
      client.setQueryData(clientKeys.detail(created.id), created);
      router.push(`/clientes/${created.id}`);
    },
    onError: () => setConvertOpen(false),
  });
  const recommendationMutation = useMutation({
    mutationFn: ({
      item,
      value,
    }: {
      item: RecommendationsResponse["items"][number];
      value: string;
    }) =>
      item.action === "ASSIGN_OWNER"
        ? updateLead(queryId, { assignedUserId: value })
        : updateLead(queryId, {
            nextFollowUpAt: new Date(value).toISOString(),
          }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: dashboardKeys.recommendations }),
        client.invalidateQueries({ queryKey: dashboardKeys.summary }),
        client.invalidateQueries({ queryKey: leadKeys.detail(queryId) }),
        client.invalidateQueries({ queryKey: leadKeys.all }),
        client.invalidateQueries({ queryKey: leadKeys.pipeline() }),
      ]);
      setSelectedRecommendation(null);
    },
  });
  const reminderMutation = useMutation({
    mutationFn: createReminder,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: reminderKeys.byLead(queryId) }),
        client.invalidateQueries({ queryKey: reminderKeys.all }),
        client.invalidateQueries({ queryKey: dashboardKeys.recommendations }),
        client.invalidateQueries({ queryKey: dashboardKeys.summary }),
      ]);
      setReminderOpen(false);
    },
  });

  if (
    !leadId ||
    (leadQuery.isError && (leadQuery.error as ApiError).status === 404)
  )
    return (
      <div className="mx-auto max-w-5xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
        <p className="font-medium">Lead no encontrado.</p>
        <Link
          href="/leads"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-medium"
        >
          Volver a Leads
        </Link>
      </div>
    );
  if (leadQuery.isPending || (leadQuery.isFetching && !leadQuery.data))
    return <DetailSkeleton />;
  if (leadQuery.isError || !leadQuery.data)
    return (
      <div className="mx-auto max-w-5xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
        <p className="font-medium">No pudimos cargar este lead.</p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          El servidor no está disponible o la solicitud tardó demasiado.
        </p>
        <button
          type="button"
          onClick={() => leadQuery.refetch()}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-medium"
        >
          <RefreshCw size={15} />
          Reintentar
        </button>
      </div>
    );
  const lead = leadQuery.data;
  const recommendations =
    (
      recommendationsQuery.data as RecommendationsResponse | undefined
    )?.items.filter((item) => item.leadId === lead.id) || [];
  const reminders = remindersQuery.data?.slice(0, 5) ?? [];
  return (
    <section className="mx-auto max-w-5xl">
      <Link
        href="/leads"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft size={16} />
        Volver a Leads
      </Link>
      <div className="mt-6 flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-[var(--primary)]">Detalle del lead</p>
          <h1 className="mt-1 text-2xl font-semibold">{lead.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {lead.company || "-"} · {lead.serviceInterest || "-"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Cambiar estado"
            value={lead.status}
            onChange={(event) =>
              updateMutation.mutate({
                status: event.target.value as Lead["status"],
              })
            }
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium"
          >
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </select>
          {lead.client ? (
            <Link
              href={`/clientes/${lead.client.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-500/30 px-3 text-sm font-medium text-[var(--success)] hover:bg-emerald-500/10"
            >
              <CheckCircle2 size={15} />
              Cliente creado
            </Link>
          ) : lead.status === "WON" ? (
            <button
              type="button"
              onClick={() => setConvertOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--primary)] px-3 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]"
            >
              Convertir en cliente
            </button>
          ) : (
            <span className="text-xs text-[var(--muted-foreground)]">
              Marca el lead como Ganado para convertirlo.
            </span>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-medium hover:bg-[var(--muted)]"
          >
            <Pencil size={15} />
            Editar
          </button>
        </div>
      </div>
      {updateMutation.isError && (
        <p className="mt-4 text-sm text-[var(--danger)]">
          No pudimos actualizar el lead. Intenta nuevamente.
        </p>
      )}
      {recommendations.length > 0 && (
        <section className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold">Acciones recomendadas</h2>
          <div className="mt-3 divide-y divide-[var(--border)]">
            {recommendations
              .filter((item) => item.action !== "OPEN_LEAD")
              .map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <p className="text-sm">{item.message}</p>
                  {item.action === "CONVERT_CLIENT" ? (
                    <button
                      type="button"
                      onClick={() => setConvertOpen(true)}
                      className="shrink-0 text-xs font-semibold text-[var(--primary)] hover:underline"
                    >
                      Convertir en cliente
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedRecommendation(item)}
                      className="shrink-0 text-xs font-semibold text-[var(--primary)] hover:underline"
                    >
                      {item.action === "ASSIGN_OWNER"
                        ? "Asignar"
                        : item.action === "RESCHEDULE_FOLLOW_UP"
                          ? "Reprogramar"
                          : "Programar"}
                    </button>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}
      <section className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Recordatorios</h2>
          <button
            type="button"
            onClick={() => setReminderOpen(true)}
            className="h-9 rounded-lg bg-[var(--primary)] px-3 text-xs font-semibold text-white"
          >
            Nuevo recordatorio
          </button>
        </div>
        {remindersQuery.isLoading ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Cargando recordatorios...
          </p>
        ) : remindersQuery.isError ? (
          <p className="mt-4 text-sm text-[var(--danger)]">
            No pudimos cargar los recordatorios.
          </p>
        ) : reminders.length ? (
          <div className="mt-3 divide-y divide-[var(--border)]">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex justify-between gap-3 py-3"
              >
                <span className="truncate text-sm">{reminder.title}</span>
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                  {format(reminder.dueAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            No hay recordatorios vinculados.
          </p>
        )}
      </section>
      <div className="mt-7 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Información
          </h2>
          <div className="mt-5 grid gap-x-5 gap-y-5 sm:grid-cols-2">
            <Info label="Nombre" value={lead.name} />
            <Info label="Empresa" value={lead.company} />
            <Info
              label="Email"
              value={lead.email}
              link={lead.email ? `mailto:${lead.email}` : undefined}
            />
            <Info
              label="Teléfono"
              value={lead.phone}
              link={lead.phone ? `tel:${lead.phone}` : undefined}
            />
            <Info label="Servicio" value={lead.serviceInterest} />
            <Info label="Origen" value={lead.source} />
            <Info
              label="Presupuesto"
              value={lead.estimatedBudget ? `S/ ${lead.estimatedBudget}` : null}
            />
            <Info label="Creado" value={format(lead.createdAt)} />
          </div>
          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <Info label="Notas" value={lead.notes} />
          </div>
        </section>
        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Seguimiento
          </h2>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Próximo seguimiento
              </p>
              <p
                className={`mt-1 text-sm font-semibold ${lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) < new Date() ? "text-[var(--danger)]" : ""}`}
              >
                {format(lead.nextFollowUpAt)}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {followUpState(lead.nextFollowUpAt)}
              </p>
            </div>
            <Info label="Último contacto" value={format(lead.lastContactAt)} />
            <Info
              label="Responsable"
              value={lead.assignedUser?.name || lead.assignedUser?.email}
            />
            <div className="rounded-lg bg-[var(--muted)] px-3 py-3 text-sm">
              <p className="font-medium">Acciones pendientes</p>
              <p className="mt-1 text-[var(--muted-foreground)]">
                {lead.nextFollowUpAt
                  ? followUpState(lead.nextFollowUpAt)
                  : "Programa un seguimiento para no perder el contacto."}
              </p>
            </div>
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Actividad</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Historial comercial más reciente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivityOpen(true)}
            className="h-10 rounded-lg bg-[var(--primary)] px-3 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]"
          >
            + Registrar actividad
          </button>
        </div>
        {activitiesQuery.isLoading ? (
          <p className="mt-8 text-sm text-[var(--muted-foreground)]">
            Cargando actividad...
          </p>
        ) : activitiesQuery.isError ? (
          <div className="mt-8 text-sm">
            <p>No pudimos cargar el historial.</p>
            <button
              type="button"
              onClick={() => activitiesQuery.refetch()}
              className="mt-3 text-[var(--primary)] hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : activitiesQuery.data?.data.length ? (
          <div className="mt-7 space-y-6">
            {activitiesQuery.data.data.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="mt-8 border-t border-[var(--border)] pt-7 text-center text-sm">
            <p className="font-medium">Aún no hay actividad registrada.</p>
            <p className="mt-1 text-[var(--muted-foreground)]">
              Registra una nota, llamada o seguimiento para empezar el
              historial.
            </p>
          </div>
        )}
      </section>
      {reminderOpen && (
        <ReminderForm
          initialLeadId={lead.id}
          initialLeadName={lead.name}
          loading={reminderMutation.isPending}
          onClose={() => setReminderOpen(false)}
          onSubmit={(data) => reminderMutation.mutate(data)}
        />
      )}
      {editing && (
        <LeadForm
          lead={lead}
          loading={updateMutation.isPending}
          onClose={() => setEditing(false)}
          onSubmit={(payload) => updateMutation.mutate(payload)}
        />
      )}
      {activityOpen && (
        <ActivityForm
          loading={activityMutation.isPending}
          onClose={() => setActivityOpen(false)}
          onSubmit={(payload) => activityMutation.mutate(payload)}
        />
      )}
      {convertOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5"
          role="presentation"
          onClick={() => setConvertOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="convert-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="convert-title" className="text-lg font-semibold">
              ¿Convertir este lead en cliente?
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Se creará un cliente conservando el lead y todo su historial
              comercial.
            </p>
            {convertMutation.isError && (
              <p className="mt-4 text-sm text-[var(--danger)]">
                No pudimos convertir este lead. Verifica que esté Ganado y que
                no haya sido convertido antes.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConvertOpen(false)}
                className="h-10 rounded-lg border border-[var(--border)] px-4 text-sm font-medium hover:bg-[var(--muted)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => convertMutation.mutate()}
                disabled={convertMutation.isPending}
                className="h-10 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
              >
                {convertMutation.isPending
                  ? "Convirtiendo..."
                  : "Convertir en cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedRecommendation && (
        <RecommendationActionDialog
          recommendation={selectedRecommendation}
          loading={recommendationMutation.isPending}
          error={
            recommendationMutation.isError
              ? "No pudimos ejecutar la acción."
              : undefined
          }
          onClose={() => setSelectedRecommendation(null)}
          onConfirm={(value) =>
            recommendationMutation.mutate({
              item: selectedRecommendation,
              value,
            })
          }
        />
      )}
    </section>
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
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="h-64 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
        <div className="h-64 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-[var(--surface-elevated)]" />
    </div>
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
function ActivityItem({ activity }: { activity: LeadActivity }) {
  const meta = typeMeta[activity.type];
  const Icon = meta.Icon;
  return (
    <div className="relative flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--primary)]">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-sm font-semibold">{meta.label}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {activity.user.name || activity.user.email} ·{" "}
            {format(activity.createdAt)}
          </p>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">
          {activity.description}
        </p>
      </div>
    </div>
  );
}
