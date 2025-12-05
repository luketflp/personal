'use client'

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { CursorProvider } from "@/components/cursor/cursor"
import AppleHello from "@/components/apple-hello"
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isHelloRunning, setIsHelloRunning] = useState(true)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AnimatePresence mode="wait">
        {isHelloRunning ? (
          <motion.div
            key="hello"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
          >
            <AppleHello onFinish={() => setIsHelloRunning(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.6, ease: "easeInOut" } }}
          >
            <CursorProvider>
              {children}
            </CursorProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </ThemeProvider>
  )
}
