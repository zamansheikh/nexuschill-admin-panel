import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'NexusChill — Admin Panel',
  description: 'Administrative console for NexusChill',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
