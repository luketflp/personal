import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TerminalTyping from '@/components/terminal-typing'
import LanguageSwitcher from '@/components/language-switcher'
import type { Dictionary, Language } from '@/lib/i18n/dictionaries'

interface HeaderProps {
  dictionary: Dictionary
  language: Language
  handleLanguageChange: (language: Language) => void
}

export default function Header({
  dictionary,
  language,
  handleLanguageChange,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navItems = [
    { href: '#about', label: dictionary.nav.about },
    { href: '#skills', label: dictionary.nav.skills },
    { href: '#projects', label: dictionary.nav.projects },
    { href: '#contact', label: dictionary.nav.contact },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-16 items-center px-4 sm:px-6 md:px-12 lg:px-24">
        <Link
          href="#top"
          className="flex items-center gap-3 leading-none"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted/40 shadow-sm lg:hidden">
            <Image
              src="/hero-me.png"
              alt="Lucas Alexander"
              fill
              priority
              draggable={false}
              sizes="40px"
              className="origin-top scale-[1.35] select-none object-cover object-top [-webkit-user-drag:none]"
            />
          </span>
          <span className="flex flex-col leading-none">
            <TerminalTyping
              text="Lucas Alexander"
              fontSize="lg"
              typingSpeed={150}
              erasingSpeed={75}
              pauseBeforeErasing={2000}
              showBorder={false}
              showShadow={false}
            />
            <span className="text-xs text-muted-foreground/80">
              {dictionary.role}
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 md:flex">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link href="#contact">{dictionary.contact.title}</Link>
          </Button>
          <LanguageSwitcher
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
          />
        </nav>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <LanguageSwitcher
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
          />
          <button
            className="rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => setIsMobileMenuOpen(open => !open)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 border-t md:hidden">
          <div className="container flex flex-col gap-1 bg-background px-4 py-4">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="mt-2" size="sm">
              <Link href="#contact" onClick={() => setIsMobileMenuOpen(false)}>
                {dictionary.contact.title}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
