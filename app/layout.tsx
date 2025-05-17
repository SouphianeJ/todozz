import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Todozz App',
  description: 'Manage your todos efficiently',
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
          <nav>
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/todo/new" className="nav-link button">New Todo</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}