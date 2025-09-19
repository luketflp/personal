'use client'

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { CursorProvider } from "@/components/cursor/cursor"
import AppleHello from "@/components/apple-hello"
import { useState } from "react"


export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isHelloRunning, setIsHelloRunning] = useState(true)

  return  (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {
        isHelloRunning ? (
          <AppleHello onFinish={() => setIsHelloRunning(false)} />
        ) : (
          <CursorProvider>
            {children}
          </CursorProvider>
        )
      }
    </ThemeProvider>
  )
}
