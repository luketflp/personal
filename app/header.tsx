import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import TerminalTyping from '@/components/terminal-typing';
import LanguageSwitcher from '@/components/language-switcher';
import type { Language } from '@/lib/i18n/dictionaries';

interface HeaderProps {
  dictionary: {
    nav: {
      about: string;
      skills: string;
    };
  };
  language: Language;
  handleLanguageChange: (language: Language) => void;
}

export default function Header({ dictionary, language, handleLanguageChange }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4 sm:px-6 md:px-12 lg:px-24">
          {/* Logo with typing animation */}
          <div className="mr-2 flex sm:mr-4">
            <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
              <TerminalTyping
                fontSize="lg" 
                text="Lucas Alexander"
                typingSpeed={150}
                erasingSpeed={75}
                pauseBeforeErasing={2000}
                showBorder={false}
              />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="ml-auto hidden items-center gap-4 md:flex lg:gap-6">
            <Link href="#about" className="text-sm font-medium hover:underline">
              {dictionary.nav.about}
            </Link>
            <Link href="#skills" className="text-sm font-medium hover:underline">
              {dictionary.nav.skills}
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle dictionary={dictionary} />
              <LanguageSwitcher currentLanguage={language} onLanguageChange={handleLanguageChange} />
            </div>
          </nav>
          
          {/* Mobile Navigation */}
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <div className="flex items-center gap-1">
              <ThemeToggle dictionary={dictionary} />
              <LanguageSwitcher currentLanguage={language} onLanguageChange={handleLanguageChange} />
            </div>
            
            <button
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 md:hidden">
            <div className="container border-t bg-background/95 px-4 py-2">
              <Link
                href="#about"
                className="block py-2 text-sm font-medium hover:underline"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {dictionary.nav.about}
              </Link>
              <Link
                href="#skills"
                className="block py-2 text-sm font-medium hover:underline"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {dictionary.nav.skills}
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}