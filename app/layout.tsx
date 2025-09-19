import "./globals.css"

import type React from "react"
import { Analytics } from "@vercel/analytics/next"
import { Inter } from "next/font/google"
import AppLayout from "./app-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Lucas | Software Engineer",
  description: "Personal website of Lucas, a passionate software engineer",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head />

      <body className={inter.className}>
        <Analytics />
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  )
}
