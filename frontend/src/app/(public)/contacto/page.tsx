'use client';

import { PublicLeadForm } from '../../../components/public/public-lead-form';
import { Brand } from '../../../components/brand';

export default function ContactoPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-5xl px-5 py-5 sm:px-8">
          <Brand />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-8">
        <section className="w-full max-w-3xl">
          <div className="mb-9 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">Cuéntanos qué necesitas</h1>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Completa tus datos y cuéntanos brevemente qué solución buscas.
              Nos pondremos en contacto contigo.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-9">
            <PublicLeadForm />
          </div>
        </section>
      </div>
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-center text-sm text-[var(--muted-foreground)]">
        <p>Desarrollo Digital Latam</p>
      </footer>
    </main>
  );
}
