'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { PasswordInput } from './password-input';

export function UserForm({ loading, onClose, onSubmit }: { loading: boolean; onClose: () => void; onSubmit: (values: { name: string; email: string; password: string }) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string>();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) return setError('Las contraseñas no coinciden.');
    setError(undefined);
    onSubmit({ name: name.trim(), email: email.trim().toLowerCase(), password });
  }

  return <Dialog title="Nuevo usuario" onClose={onClose}>
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field label="Nombre"><input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} autoComplete="name" /></Field>
      <Field label="Correo electrónico"><input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} autoComplete="email" /></Field>
      <Field label="Contraseña inicial"><PasswordInput id="new-user-password" value={password} onChange={setPassword} autoComplete="new-password" /></Field>
      <Field label="Confirmar contraseña"><PasswordInput id="new-user-password-confirmation" value={confirmation} onChange={setConfirmation} autoComplete="new-password" /></Field>
      <p className="text-xs text-[var(--muted-foreground)]">Mínimo 12 caracteres.</p>
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[var(--danger)]" role="alert">{error}</p>}
      <Actions loading={loading} onClose={onClose} label="Crear usuario" />
    </form>
  </Dialog>;
}

export function PasswordForm({ loading, userName, onClose, onSubmit }: { loading: boolean; userName: string; onClose: () => void; onSubmit: (password: string) => void }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string>();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 12) return setError('La contraseña debe tener al menos 12 caracteres.');
    if (password !== confirmation) return setError('Las contraseñas no coinciden.');
    setError(undefined);
    onSubmit(password);
  }

  return <Dialog title="Cambiar contraseña" description={userName} onClose={onClose}>
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field label="Nueva contraseña"><PasswordInput id="change-user-password" value={password} onChange={setPassword} autoComplete="new-password" /></Field>
      <Field label="Confirmar contraseña"><PasswordInput id="change-user-password-confirmation" value={confirmation} onChange={setConfirmation} autoComplete="new-password" /></Field>
      <p className="text-xs text-[var(--muted-foreground)]">Mínimo 12 caracteres.</p>
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[var(--danger)]" role="alert">{error}</p>}
      <Actions loading={loading} onClose={onClose} label="Actualizar contraseña" />
    </form>
  </Dialog>;
}

function Dialog({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" role="presentation" onClick={onClose} onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
    <div className="flex h-full w-full max-w-xl flex-col bg-[var(--surface)] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="user-form-title" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between border-b border-[var(--border)] px-6 py-6"><div><h2 id="user-form-title" className="text-xl font-semibold">{title}</h2>{description && <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{description}</p>}</div><button type="button" onClick={onClose} className="rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)]" aria-label="Cerrar formulario"><X size={19} /></button></div>
      <div className="overflow-y-auto px-6 py-7">{children}</div>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-medium">{label}<div className="mt-2">{children}</div></label>; }
function Actions({ loading, onClose, label }: { loading: boolean; onClose: () => void; label: string }) { return <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-6"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-[var(--border)] px-4 text-sm font-medium hover:bg-[var(--muted)]">Cancelar</button><button type="submit" disabled={loading} className="h-10 rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-60">{loading ? 'Guardando...' : label}</button></div>; }

const inputClass = 'h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:border-[var(--primary)]';
