import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finansystem - Contabilidad Diaria',
  description: 'Sistema de contabilidad diaria para tiendas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}