import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Claude Video Editor',
  description: 'AI-first video editing — describe edits in plain language.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://rsms.me/inter/inter.css"
        />
      </head>
      <body className="bg-bg text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
