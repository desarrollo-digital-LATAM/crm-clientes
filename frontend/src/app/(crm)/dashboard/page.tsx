"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchDashboardSummary,
  fetchRecommendations,
  dashboardKeys,
} from "../../../lib/api/dashboard";
import { fetchReminders, reminderKeys } from "../../../lib/api/reminders";
import { STATUS_META, type LeadStatus } from "../../../types/leads";
import type { Reminder } from "../../../types/reminders";
import { RecommendationPanel } from "../../../components/automation/recommendation-panel";
import { RecommendationActionDialog } from "../../../components/automation/recommendation-action-dialog";
import type { Recommendation } from "../../../types/dashboard";
import { convertLead, leadKeys, updateLead } from "../../../lib/api/leads";
import { clientKeys } from "../../../lib/api/clients";

const statuses: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];
const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const activityLabels: Record<string, string> = {
  NOTE: "Nota",
  CALL: "Llamada",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  MEETING: "Reunión",
  STATUS_CHANGE: "Estado",
  FOLLOW_UP: "Seguimiento",
};
const sourceLabels: Record<string, string> = {
  MANUAL: "Manual",
  WEBSITE: "Sitio web",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  REFERRAL: "Referido",
  PHONE: "Teléfono",
  OTHER: "Otro",
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<Recommendation | null>(null);
  const query = useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: fetchDashboardSummary,
    staleTime: 45_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  const recommendations = useQuery({
    queryKey: dashboardKeys.recommendations,
    queryFn: fetchRecommendations,
    staleTime: 45_000,
    retry: 1,
  });
  const reminders = useQuery({
    queryKey: reminderKeys.list({ status: "pending" }),
    queryFn: () => fetchReminders({ status: "pending" }),
    staleTime: 45_000,
    retry: 1,
  });
  const actionMutation = useMutation({
    mutationFn: async ({
      item,
      value,
    }: {
      item: Recommendation;
      value: string;
    }) => {
      if (item.action === "ASSIGN_OWNER")
        return updateLead(item.leadId, { assignedUserId: value });
      return updateLead(item.leadId, {
        nextFollowUpAt: new Date(value).toISOString(),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.recommendations,
        }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: leadKeys.pipeline() }),
      ]);
      setSelectedRecommendation(null);
    },
  });
  const convertMutation = useMutation({
    mutationFn: convertLead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.recommendations,
        }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.summary }),
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: clientKeys.all }),
      ]);
      setSelectedRecommendation(null);
    },
  });

  if (query.isPending) return <DashboardSkeleton />;
  if (query.isError)
    return (
      <section className="mx-auto max-w-[1480px]">
        <Header />
        <Panel className="py-16 text-center">
          <p className="font-medium">No pudimos cargar el resumen comercial.</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-medium"
          >
            <RefreshCw size={15} />
            Reintentar
          </button>
        </Panel>
      </section>
    );

  const data = query.data;
  const maxPipeline = Math.max(
    ...statuses.map((status) => data.leads[status]),
    1,
  );
  const maxSource = Math.max(...data.bySource.map((item) => item.count), 1);
  const maxService = Math.max(...data.byService.map((item) => item.count), 1);
  const attentionTone =
    data.followUps.overdue > 0
      ? "text-[var(--danger)]"
      : "text-[var(--success)]";

  return (
    <section className="mx-auto max-w-[1480px]">
      <Header />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          icon={Users}
          label="Leads"
          value={data.leads.total}
          href="/leads"
        />
        <Metric
          icon={TrendingUp}
          label="Nuevos 7d"
          value={data.leads.new}
          context="Últimos 7 días"
        />
        <Metric
          icon={CheckCircle2}
          label="Clientes"
          value={data.clients.total}
          href="/clientes"
        />
        <Metric
          icon={TrendingUp}
          label="Conversión"
          value={`${data.conversion.rate}%`}
          context="Clientes / leads"
        />
        <Metric
          icon={CalendarClock}
          label="Seguimientos vencidos"
          value={data.followUps.overdue}
          href="/leads"
          alert={data.followUps.overdue > 0}
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <SectionTitle title="Pipeline comercial" />
          <div className="mt-5 space-y-4">
            {statuses.map((status) => (
              <div key={status}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{STATUS_META[status].label}</span>
                  <strong>{data.leads[status]}</strong>
                </div>
                <div className="h-2 rounded-full bg-[var(--muted)]">
                  <div
                    className="h-2 rounded-full bg-[var(--primary)] transition-all"
                    style={{
                      width: `${(data.leads[status] / maxPipeline) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle title="Atención requerida" />
          <div
            className={`mt-5 rounded-lg border px-4 py-3 ${data.followUps.overdue > 0 ? "border-[var(--danger)]/30 bg-[var(--danger)]/10" : "border-[var(--success)]/25 bg-[var(--success)]/10"}`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className={attentionTone} />
              <div>
                <p className={`text-sm font-semibold ${attentionTone}`}>
                  {data.followUps.overdue > 0
                    ? `${data.followUps.overdue} seguimientos vencidos`
                    : "Todo al día"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {data.followUps.today} para hoy · {data.followUps.upcoming}{" "}
                  próximos
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/leads"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            Revisar leads <ArrowRight size={15} />
          </Link>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionTitle title="Próximos seguimientos" />
          <div className="mt-4 divide-y divide-[var(--border)]">
            {data.upcomingFollowUps.length ? (
              data.upcomingFollowUps.map((lead) => (
                <Link
                  href={`/leads/${lead.id}`}
                  key={lead.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{lead.name}</p>
                    <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                      {lead.company || "Sin empresa"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                    {dateFormatter.format(new Date(lead.nextFollowUpAt))}
                  </span>
                </Link>
              ))
            ) : (
              <Empty text="No hay seguimientos próximos." />
            )}
          </div>
        </Panel>
        <Panel>
          <SectionTitle title="Leads por origen" />
          <Bars
            items={data.bySource.map((item) => ({
              label: sourceLabels[item.source] || item.source,
              count: item.count,
            }))}
            max={maxSource}
          />
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionTitle title="Servicios de interés" />
          <Bars
            items={data.byService.map((item) => ({
              label: item.service,
              count: item.count,
            }))}
            max={maxService}
          />
        </Panel>
        <Panel>
          <SectionTitle title="Actividad reciente" />
          <div className="mt-4 divide-y divide-[var(--border)]">
            {data.recentActivities.length ? (
              data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--primary)]">
                    <Activity size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {activityLabels[activity.type] || activity.type} ·{" "}
                      {activity.lead.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                      {activity.description}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {dateFormatter.format(new Date(activity.createdAt))}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <Empty text="Aún no hay actividad registrada." />
            )}
          </div>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ReminderPanel query={reminders} />
        <RecommendationPanel
          query={recommendations}
          onAction={setSelectedRecommendation}
        />
      </div>
      {selectedRecommendation &&
        (selectedRecommendation.action === "CONVERT_CLIENT" ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5"
            role="presentation"
            onClick={() => setSelectedRecommendation(null)}
          >
            <div
              className="w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 shadow-xl"
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="text-lg font-semibold">Convertir en cliente</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {selectedRecommendation.message}
              </p>
              {convertMutation.isError && (
                <p className="mt-3 text-sm text-[var(--danger)]">
                  No pudimos convertir este lead en cliente.
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRecommendation(null)}
                  className="h-10 rounded-lg border border-[var(--border)] px-4 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={convertMutation.isPending}
                  onClick={() =>
                    convertMutation.mutate(selectedRecommendation.leadId)
                  }
                  className="h-10 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {convertMutation.isPending ? "Convirtiendo..." : "Convertir"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <RecommendationActionDialog
            recommendation={selectedRecommendation}
            loading={actionMutation.isPending}
            error={
              actionMutation.isError
                ? "No pudimos ejecutar la acción."
                : undefined
            }
            onClose={() => setSelectedRecommendation(null)}
            onConfirm={(value) =>
              actionMutation.mutate({ item: selectedRecommendation, value })
            }
          />
        ))}
    </section>
  );
}

function Header() {
  return (
    <div className="mb-8">
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
        Resumen comercial
      </p>
      <h1 className="mt-2 text-[26px] font-semibold tracking-tight">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Resumen de tu actividad comercial.
      </p>
    </div>
  );
}
function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold tracking-tight">{title}</h2>;
}

function ReminderPanel({ query }: { query: ReturnType<typeof useQuery> }) {
  const reminders = query.data as Reminder[] | undefined;
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell size={17} className="text-[var(--primary)]" />
          <SectionTitle title="Recordatorios" />
        </div>
        <Link
          href="/recordatorios"
          className="text-xs font-semibold text-[var(--primary)] hover:underline"
        >
          Ver recordatorios <ArrowRight className="inline" size={13} />
        </Link>
      </div>
      {query.isPending ? (
        <div className="mt-4 space-y-3" aria-hidden="true">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-lg bg-[var(--surface-elevated)] p-3"
            >
              <div className="h-3 w-2/3 rounded bg-[var(--muted)]" />
              <div className="mt-2 h-3 w-1/3 rounded bg-[var(--muted)]" />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <div className="mt-4 text-sm">
          <p>No pudimos cargar tus recordatorios.</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-2 text-[var(--primary)] hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : reminders?.length ? (
        <div className="mt-4 divide-y divide-[var(--border)]">
          {reminders.slice(0, 5).map((reminder) => (
            <Link
              href="/recordatorios"
              key={reminder.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{reminder.title}</p>
                <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                  {reminder.lead?.name || "Sin lead"} ·{" "}
                  {dateFormatter.format(new Date(reminder.dueAt))}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--warning)]/10 px-2 py-1 text-[11px] text-[var(--warning)]">
                Pendiente
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/10 px-4 py-3">
          <p className="text-sm font-semibold text-[var(--success)]">
            Todo al día
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            No tienes recordatorios pendientes.
          </p>
        </div>
      )}
    </Panel>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  context,
  href,
  alert,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  context?: string;
  href?: string;
  alert?: boolean;
}) {
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        <p
          className={`mt-2 text-2xl font-semibold tracking-tight ${alert ? "text-[var(--danger)]" : ""}`}
        >
          {value}
        </p>
        {context && (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {context}
          </p>
        )}
      </div>
      <Icon size={18} className="text-[var(--primary)]" />
    </div>
  );
  return href ? (
    <Link
      href={href}
      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 transition-colors hover:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
      {content}
    </div>
  );
}
function Bars({
  items,
  max,
}: {
  items: { label: string; count: number }[];
  max: number;
}) {
  return (
    <div className="mt-5 space-y-4">
      {items.length ? (
        items.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex justify-between gap-4 text-sm">
              <span className="truncate">{item.label}</span>
              <strong>{item.count}</strong>
            </div>
            <div className="h-2 rounded-full bg-[var(--muted)]">
              <div
                className="h-2 rounded-full bg-[var(--primary)]"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))
      ) : (
        <Empty text="Aún no hay datos para mostrar." />
      )}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="py-5 text-sm text-[var(--muted-foreground)]">{text}</p>;
}

function DashboardSkeleton() {
  return (
    <section
      className="mx-auto max-w-[1480px]"
      aria-busy="true"
      aria-label="Cargando resumen comercial"
    >
      <Header />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <MetricSkeleton key={index} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SkeletonPanel>
          <SkeletonTitle />
          <SkeletonBars />
        </SkeletonPanel>
        <SkeletonPanel>
          <SkeletonTitle />
          <SkeletonLine className="mt-5 h-16 w-full" />
          <SkeletonLine className="mt-5 h-4 w-28" />
        </SkeletonPanel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SkeletonPanel>
          <SkeletonTitle />
          <SkeletonBars />
        </SkeletonPanel>
        <SkeletonPanel>
          <SkeletonTitle />
          <SkeletonBars />
        </SkeletonPanel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SkeletonPanel>
          <SkeletonTitle />
          <SkeletonBars />
        </SkeletonPanel>
        <SkeletonPanel>
          <SkeletonTitle />
          <SkeletonBars />
        </SkeletonPanel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SkeletonPanel>
          <SkeletonTitle />
          <SkeletonBars />
        </SkeletonPanel>
        <SkeletonPanel>
          <SkeletonTitle />
          <SkeletonBars />
        </SkeletonPanel>
      </div>
    </section>
  );
}
function SkeletonPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
      {children}
    </div>
  );
}
function SkeletonTitle() {
  return <SkeletonLine className="h-4 w-36" />;
}
function SkeletonLine({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-md bg-[var(--muted)] ${className}`}
    />
  );
}
function MetricSkeleton() {
  return (
    <div
      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <SkeletonLine className="h-4 w-20" />
          <SkeletonLine className="mt-3 h-8 w-14" />
          <SkeletonLine className="mt-2 h-3 w-24" />
        </div>
        <SkeletonLine className="h-5 w-5 rounded-full" />
      </div>
    </div>
  );
}
function SkeletonBars() {
  return (
    <div className="mt-5 space-y-4" aria-hidden="true">
      {[1, 2, 3].map((item) => (
        <div key={item}>
          <div className="mb-1.5 flex justify-between">
            <SkeletonLine className="h-4 w-28" />
            <SkeletonLine className="h-4 w-6" />
          </div>
          <SkeletonLine className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
