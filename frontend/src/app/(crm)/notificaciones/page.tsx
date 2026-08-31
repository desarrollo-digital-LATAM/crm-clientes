'use client';

import { Bell, CheckCheck, Circle } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, notificationKeys } from '../../../lib/api/notifications';
import type { Notification, NotificationFilter } from '../../../types/notifications';

const filters: Array<{ label: string; value: NotificationFilter }> = [{ label: 'Todas', value: 'all' }, { label: 'No leídas', value: 'unread' }, { label: 'Leídas', value: 'read' }];
function relativeTime(value: string) {
  const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(minutes, 'minute');
  return new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(Math.round(minutes / 60), 'hour');
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const router = useRouter();
  const query = useQuery({ queryKey: notificationKeys.list(filter, page), queryFn: () => fetchNotifications(filter, page) });
  const readMutation = useMutation({ mutationFn: markNotificationRead, onSuccess: () => { queryClient.invalidateQueries({ queryKey: notificationKeys.all }); } });
  const allReadMutation = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: () => { queryClient.invalidateQueries({ queryKey: notificationKeys.all }); } });
  function selectNotification(notification: Notification) { if (!notification.readAt) readMutation.mutate(notification.id); if (notification.href) router.push(notification.href); }

  return <main className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Centro de actividad</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Notificaciones</h1><p className="mt-2 text-sm text-[var(--muted-foreground)]">Mantente al día con la actividad comercial.</p></div>{query.data?.data.some((item) => !item.readAt) && <button type="button" onClick={() => allReadMutation.mutate()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-medium hover:bg-[var(--muted)]"><CheckCheck size={16} />Marcar todas como leídas</button>}</div>
    <div className="mt-8 flex flex-wrap gap-2">{filters.map((item) => <button type="button" key={item.value} onClick={() => { setFilter(item.value); setPage(1); }} className={`rounded-full px-3 py-1.5 text-sm ${filter === item.value ? 'bg-blue-600 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>{item.label}</button>)}</div>
    <section className="mt-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">{query.isPending ? <div className="space-y-3 p-5" aria-hidden="true">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />)}</div> : query.isError ? <div className="p-6 text-sm"><p>No pudimos cargar tus notificaciones.</p><button type="button" onClick={() => query.refetch()} className="mt-2 text-blue-600">Reintentar</button></div> : query.data?.data.length ? <div>{query.data.data.map((notification) => <button type="button" key={notification.id} onClick={() => selectNotification(notification)} className={`flex w-full gap-3 border-b border-[var(--border-subtle)] px-5 py-4 text-left last:border-0 hover:bg-[var(--muted)] ${notification.readAt ? '' : 'bg-blue-500/[0.06]'}`}><Circle size={8} className={`mt-1.5 shrink-0 ${notification.readAt ? 'text-transparent' : 'fill-blue-600 text-blue-600'}`} /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{notification.title}</span>{notification.message && <span className="mt-1 block text-sm text-[var(--muted-foreground)]">{notification.message}</span>}<span className="mt-2 block text-xs text-[var(--muted-foreground)]">{relativeTime(notification.createdAt)}</span></span></button>)}</div> : <div className="p-12 text-center"><Bell className="mx-auto text-[var(--muted-foreground)]" size={24} /><p className="mt-3 text-sm font-medium">Todo al día</p><p className="mt-1 text-sm text-[var(--muted-foreground)]">No tienes notificaciones por ahora.</p></div>}
    {query.data && query.data.pagination.totalPages > 1 && <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-3 text-sm"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-40">Anterior</button><span className="text-[var(--muted-foreground)]">Página {page} de {query.data.pagination.totalPages}</span><button type="button" disabled={page >= query.data.pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-40">Siguiente</button></div>}
    </section>
  </main>;
}
