'use client';

import { Bell, CheckCheck, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { fetchNotifications, fetchUnreadCount, markAllNotificationsRead, markNotificationRead, notificationKeys } from '../../lib/api/notifications';
import type { Notification, NotificationsResponse } from '../../types/notifications';

function relativeTime(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  return formatter.format(Math.round(minutes / 60), 'hour');
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const countQuery = useQuery({ queryKey: notificationKeys.unreadCount, queryFn: fetchUnreadCount, staleTime: 45_000 });
  const listQuery = useQuery({ queryKey: notificationKeys.list('all', 1), queryFn: () => fetchNotifications('all', 1, 5), enabled: open, staleTime: 30_000 });
  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list('all', 1) });
      const previous = queryClient.getQueryData<NotificationsResponse>(notificationKeys.list('all', 1));
      queryClient.setQueryData(notificationKeys.list('all', 1), (current: NotificationsResponse | undefined) => current ? { ...current, data: current.data.map((item) => item.id === id && !item.readAt ? { ...item, readAt: new Date().toISOString() } : item) } : current);
      queryClient.setQueryData(notificationKeys.unreadCount, (current: { count: number } | undefined) => current ? { count: Math.max(0, current.count - 1) } : current);
      return { previous };
    },
    onError: (_error, _id, context) => { if (context?.previous) queryClient.setQueryData(notificationKeys.list('all', 1), context.previous); queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: notificationKeys.lists() }); queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }); },
  });
  const allReadMutation = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: () => { queryClient.invalidateQueries({ queryKey: notificationKeys.all }); } });

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);

  function openNotification(notification: Notification) {
    if (!notification.readAt) readMutation.mutate(notification.id);
    setOpen(false);
    if (notification.href) router.push(notification.href);
  }

  const count = countQuery.data?.count ?? 0;
  return <div className="relative">
    <button type="button" aria-label="Notificaciones" aria-expanded={open} onClick={() => setOpen(!open)} className="relative rounded-lg p-2.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
      <Bell size={19} />
      {count > 0 && <span aria-label={`${count} notificaciones sin leer`} className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[10px] font-bold leading-4 text-white">{count > 9 ? '9+' : count}</span>}
    </button>
    {open && <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-xl" role="dialog" aria-label="Notificaciones">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3"><p className="font-semibold">Notificaciones</p>{count > 0 && <button type="button" onClick={() => allReadMutation.mutate()} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><CheckCheck size={14} />Marcar todas como leídas</button>}</div>
      {listQuery.isPending ? <div className="space-y-2 p-4" aria-hidden="true">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-14 animate-pulse rounded-lg bg-[var(--surface-elevated)]" />)}</div> : listQuery.isError ? <div className="p-5 text-sm"><p>No pudimos cargar tus notificaciones.</p><button type="button" onClick={() => listQuery.refetch()} className="mt-2 text-blue-600">Reintentar</button></div> : listQuery.data?.data.length ? <div>{listQuery.data.data.map((notification) => <button type="button" key={notification.id} onClick={() => openNotification(notification)} className={`flex w-full gap-3 border-b border-[var(--border-subtle)] px-4 py-3 text-left last:border-0 hover:bg-[var(--muted)] ${notification.readAt ? '' : 'bg-blue-500/[0.06]'}`}><Circle size={8} className={`mt-1.5 shrink-0 ${notification.readAt ? 'text-transparent' : 'fill-blue-600 text-blue-600'}`} /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{notification.title}</span>{notification.message && <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">{notification.message}</span>}<span className="mt-1 block text-[11px] text-[var(--muted-foreground)]">{relativeTime(notification.createdAt)}</span></span></button>)}</div> : <div className="px-5 py-8 text-center text-sm"><p className="font-medium">Todo al día</p><p className="mt-1 text-[var(--muted-foreground)]">No tienes notificaciones por ahora.</p></div>}
      <button type="button" onClick={() => { setOpen(false); router.push('/notificaciones'); }} className="w-full border-t border-[var(--border-subtle)] px-4 py-3 text-center text-sm font-medium text-blue-600 hover:bg-[var(--muted)]">Ver todas</button>
    </div>}
  </div>;
}
