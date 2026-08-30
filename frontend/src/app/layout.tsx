import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/providers';

export const metadata: Metadata = {
  title: 'CRM Clientes | Desarrollo Digital Latam',
  description: 'Gestión interna de leads y clientes',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
