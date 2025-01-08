import React from 'react';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Hotbound AI',
  description: 'AI-powered sales training platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}