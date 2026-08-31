import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Contacto - Desarrollo Digital Latam',
  description: 'Cuéntanos qué necesitas. Completa tus datos y te contactaremos.',
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return children;
}
