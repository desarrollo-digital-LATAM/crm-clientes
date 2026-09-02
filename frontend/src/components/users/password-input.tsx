'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export const inputClass = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus-visible:outline-none dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-[var(--foreground)] dark:placeholder:text-[var(--muted-foreground)] dark:focus:border-[var(--primary)]';

export function PasswordInput({ id, value, onChange, autoComplete, placeholder }: { id: string; value: string; onChange: (value: string) => void; autoComplete?: string; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return <div className="relative mt-2">
    <input id={id} className={`${inputClass} pr-11`} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} placeholder={placeholder} />
    <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-transparent text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]/60 hover:text-[var(--foreground)] focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[var(--primary)]" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
      {visible ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  </div>;
}
