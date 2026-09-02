'use client';

import { useEffect, useState } from 'react';
import { KeyRound, RefreshCw, ShieldAlert, UserPlus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../../lib/api/client';
import { fetchCurrentUser } from '../../../lib/api/auth';
import { changeUserPassword, createUser, fetchUsers, updateUser } from '../../../lib/api/users';
import { PasswordForm, UserForm } from '../../../components/users/user-form';
import type { ManagedUser } from '../../../types/users';

const dateFormatter = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<'create' | 'password'>();
  const [selected, setSelected] = useState<ManagedUser>();
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();
  const profile = useQuery({ queryKey: ['auth', 'me'], queryFn: fetchCurrentUser });
  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers, enabled: profile.data?.role === 'ADMIN' });
  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; email?: string; active?: boolean } }) => updateUser(id, payload),
    onSuccess: async (_, variables) => { await queryClient.invalidateQueries({ queryKey: ['users'] }); setNotice({ text: variables.payload.active === undefined ? 'Usuario actualizado.' : variables.payload.active ? 'Usuario activado.' : 'Usuario desactivado.' }); },
    onError: (error) => setNotice({ text: getErrorMessage(error), error: true }),
  });
  const createMutation = useMutation({ mutationFn: createUser, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['users'] }); setDialog(undefined); setNotice({ text: 'Usuario creado.' }); }, onError: (error) => setNotice({ text: getErrorMessage(error), error: true }) });
  const passwordMutation = useMutation({ mutationFn: ({ id, password }: { id: string; password: string }) => changeUserPassword(id, password), onSuccess: () => { setDialog(undefined); setSelected(undefined); setNotice({ text: 'Contraseña actualizada.' }); }, onError: (error) => setNotice({ text: getErrorMessage(error), error: true }) });

  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(undefined), 4000); return () => clearTimeout(timer); }, [notice]);

  if (profile.data?.role !== 'ADMIN') return <AccessDenied />;
  return <section className="mx-auto max-w-[1480px]">
    <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-[var(--primary)]">Configuración</p><h1 className="mt-1 text-[26px] font-semibold tracking-tight">Usuarios</h1><p className="mt-2 text-[15px] text-[var(--muted-foreground)]">Gestiona las cuentas con acceso al CRM.</p></div><button type="button" onClick={() => setDialog('create')} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]"><UserPlus size={17} />Nuevo usuario</button></div>
    {notice && <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${notice.error ? 'border-red-500/20 bg-red-500/10 text-[var(--danger)]' : 'border-emerald-500/20 bg-emerald-500/10 text-[var(--success)]'}`} role={notice.error ? 'alert' : 'status'}>{notice.text}</div>}
    {users.isLoading ? <TableSkeleton /> : users.isError ? <State title="No pudimos cargar los usuarios." action="Reintentar" onAction={() => users.refetch()} /> : users.data?.length ? <UserTable users={users.data} onPassword={(user) => { setSelected(user); setDialog('password'); }} onToggle={(user) => mutation.mutate({ id: user.id, payload: { active: !user.active } })} /> : <State title="No hay usuarios todavía." />}
    {dialog === 'create' && <UserForm loading={createMutation.isPending} onClose={() => setDialog(undefined)} onSubmit={(values) => createMutation.mutate(values)} />}
    {dialog === 'password' && selected && <PasswordForm userName={selected.name || selected.email} loading={passwordMutation.isPending} onClose={() => { setDialog(undefined); setSelected(undefined); }} onSubmit={(password) => passwordMutation.mutate({ id: selected.id, password })} />}
  </section>;
}

function UserTable({ users, onPassword, onToggle }: { users: ManagedUser[]; onPassword: (user: ManagedUser) => void; onToggle: (user: ManagedUser) => void }) { return <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs uppercase tracking-wide text-[var(--muted-foreground)]"><tr>{['Nombre', 'Correo', 'Estado', 'Fecha de creación', 'Acciones'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-[var(--border)]">{users.map((user) => <tr key={user.id} className="transition-colors hover:bg-[var(--surface-secondary)]"><td className="px-4 py-4 font-semibold">{user.name || 'Sin nombre'}</td><td className="px-4 py-4 text-[var(--muted-foreground)]">{user.email}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.active ? 'bg-emerald-500/10 text-[var(--success)]' : 'bg-slate-500/10 text-[var(--muted-foreground)]'}`}>{user.active ? 'Activo' : 'Inactivo'}</span></td><td className="whitespace-nowrap px-4 py-4 text-[var(--muted-foreground)]">{dateFormatter.format(new Date(user.createdAt))}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onPassword(user)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium hover:bg-[var(--muted)]"><KeyRound size={14} />Cambiar contraseña</button><button type="button" onClick={() => onToggle(user)} className="h-8 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium hover:bg-[var(--muted)]">{user.active ? 'Desactivar' : 'Activar'}</button></div></td></tr>)}</tbody></table></div></div>; }
function TableSkeleton() { return <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]" aria-busy="true" aria-hidden="true"><div className="h-12 border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)]" />{Array.from({ length: 5 }).map((_, index) => <div key={index} className="flex gap-4 border-b border-[var(--border-subtle)] px-4 py-5"><div className="h-4 w-36 animate-pulse rounded bg-[var(--muted)]" /><div className="h-4 w-48 animate-pulse rounded bg-[var(--muted)]" /></div>)}</div>; }
function State({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) { return <div className="border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center"><p className="font-medium">{title}</p>{action && onAction && <button type="button" onClick={onAction} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-medium"><RefreshCw size={15} />{action}</button>}</div>; }
function AccessDenied() { return <div className="mx-auto flex max-w-xl flex-col items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center"><ShieldAlert className="text-[var(--warning)]" size={28} /><h1 className="mt-4 text-xl font-semibold">No tienes permisos para administrar usuarios.</h1><p className="mt-2 text-sm text-[var(--muted-foreground)]">Solo los administradores pueden gestionar cuentas del CRM.</p></div>; }
function getErrorMessage(error: unknown) { if (error instanceof ApiError && error.status === 403) return 'No tienes permisos para administrar usuarios.'; if (error instanceof ApiError && error.status === 409) return 'Ya existe un usuario con ese correo.'; return 'No pudimos completar la operación.'; }
