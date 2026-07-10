'use client'

import type React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const shouldReduceMotion = useReducedMotion()
  // Routes sharing a key swap without the page transition: dashboard tabs,
  // and quote ↔ home (customers hop between them).
  const transitionKey = pathname.startsWith('/dashboard')
    ? 'dashboard'
    : pathname === '/' || pathname.startsWith('/q/')
      ? 'home'
      : pathname

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={transitionKey}
          className="page-transition relative min-h-screen overflow-x-clip"
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 28, scale: 0.988, filter: 'blur(14px)' }
          }
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
          }
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -14, scale: 1.004, filter: 'blur(8px)' }
          }
          transition={{
            duration: shouldReduceMotion ? 0.2 : 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_top,hsl(var(--background)),hsl(var(--muted)/0.96)_48%,hsl(var(--background)))]"
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0.92, scale: 1, y: 0 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 1.015, y: -56 }
            }
            transition={{
              duration: shouldReduceMotion ? 0.01 : 0.72,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
          {children}
        </motion.div>
      </AnimatePresence>
      <Toaster />
    </ThemeProvider>
  )
}
