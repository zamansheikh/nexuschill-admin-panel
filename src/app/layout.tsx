import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Party App — Admin Panel',
  description: 'Administrative console for Party App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
