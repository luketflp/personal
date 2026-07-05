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

const PERSON_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Lucas Alexander',
  url: SITE_URL,
  image: `${SITE_URL}/hero-me.png`,
  jobTitle: 'Software Engineer',
  description: DESCRIPTION,
  sameAs: [
    'https://github.com/luketflp',
    'https://www.linkedin.com/in/luca-soares/',
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/',
  },
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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_SCHEMA) }}
        />
      </head>

      <body className={inter.className}>
        <Analytics />
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
