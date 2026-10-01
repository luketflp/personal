import './globals.css'

import type React from 'react'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import AppLayout from './app-layout'

const inter = Inter({ subsets: ['latin'] })

// www is the primary domain on Vercel; the apex 308-redirects to it and
// WhatsApp's crawler won't follow redirects on og:image.
const SITE_URL = 'https://www.lucasalexander.com.br'
const TITLE = 'Lucas Alexander | Engenheiro full-stack · Sites e sistemas web'
const DESCRIPTION =
  'Engenheiro full-stack: crio sites, landing pages e sistemas web de ponta a ponta. Marketplaces, pagamentos e produtos em Rails, React e Next.js.'

const PERSON_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Lucas Alexander',
  url: SITE_URL,
  image: `${SITE_URL}/hero-me.png`,
  jobTitle: 'Engenheiro de Software Full-stack',
  description: DESCRIPTION,
  sameAs: [
    'https://github.com/luketflp',
    'https://www.linkedin.com/in/luca-soares/',
  ],
}

const SERVICE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Lucas Alexander',
  url: SITE_URL,
  image: `${SITE_URL}/hero-me.png`,
  description:
    'Criação de sites, landing pages e sistemas web sob medida, do design à infraestrutura.',
  telephone: '+1-347-380-1192',
  founder: { '@type': 'Person', name: 'Lucas Alexander', url: SITE_URL },
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
    apple: '/apple-touch-icon.png',
  },
  // og:image comes from app/opengraph-image.tsx (file convention).
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Lucas Alexander',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([PERSON_SCHEMA, SERVICE_SCHEMA]),
          }}
        />
      </head>

      <body className={inter.className}>
        <Analytics />
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
