import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CSIBER AQAR System',
  description:
    'NAAC Annual Quality Assurance Report data collection and generation for CSIBER (Autonomous College format)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
