import { JetBrains_Mono, Source_Serif_4 } from 'next/font/google'

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-contract-serif',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-contract-mono',
  display: 'swap',
})

// Put on a contract page's root; enables font-contract-serif/-mono inside.
export const contractFonts = `${serif.variable} ${mono.variable}`
