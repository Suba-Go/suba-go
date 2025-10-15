import { type Metadata } from 'next';
import ClientLayout from './client-layout';
import './global.css';

export const metadata: Metadata = {
  title: 'Suba&Go',
  icons: [{ rel: 'icon', url: '/logo-black.png' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
