import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Visa Acceptance Agent Toolkit Prototype',
  description:
    'Barebones live prototype showcasing the Visa Acceptance Agent Toolkit powered by the Vercel AI SDK.'
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
