import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Todozz App',
  description: 'Manage your todos efficiently',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/icon.png', type: 'image/png', sizes: '192x192' }],
  },
  openGraph: {
    title: 'Todozz App',
    description: 'Manage your todos efficiently',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Todozz App',
    description: 'Manage your todos efficiently',
    images: ['/opengraph-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <h1>
            <Link href="/">Todozz</Link>
          </h1>
          <nav className="nav-actions">
            <Link href="/" className="nav-icon" aria-label="Home">
              🏠
            </Link>
            <Link href="/todo/new" className="button">New Todo</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}