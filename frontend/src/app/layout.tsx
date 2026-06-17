import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'HSC - AI-Assisted QC Workflow Tool',
  description: 'Transform specifications into test strategies, test cases, and bug reports',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} style={{ colorScheme: 'dark' }}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
