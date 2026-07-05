import './globals.css'

import type React from 'react'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import AppLayout from './app-layout'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = 'https://lucasalexander.com.br'
const TITLE = 'Lucas Alexander | Software Engineer'
const DESCRIPTION =
  'Full-stack engineer who builds web systems end to end — from infrastructure to application. Marketplaces, payments, and products in Ruby on Rails, React, and Next.js.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Lucas Alexander',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: '/og-cover.png',
        width: 1200,
        height: 630,
        alt: 'Lucas Alexander — Engenheiro Full-stack',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-cover.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />

      <body className={inter.className}>
        <Analytics />
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
