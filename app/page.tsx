"use client"

import { Button } from "@/components/ui/button"
import { type Dictionary, type Language, dictionaries } from "@/lib/i18n/dictionaries"
import { Github, Instagram, Linkedin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import Header from "./header"
import PlayBar from "@/components/play-bar"

export default function Home() {
  const [language, setLanguage] = useState<Language>("pt")
  const [dictionary, setDictionary] = useState<Dictionary>(dictionaries.pt)
  const [mounted, setMounted] = useState(false)

  const goToGithub = useCallback(() => {
    window.open('https://github.com/luketflp', '_blank')
  }, [])

  const goToInstagram = useCallback(() => {
    window.open('https://www.instagram.com/olucasalexander/', '_blank')
  }, [])

  const goToLinkedin = useCallback(() => {
    window.open('https://www.linkedin.com/in/luca-soares/', '_blank')
  }, [])

  useEffect(() => {
    // Check if there's a saved language preference in localStorage
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && ["pt", "en", "es"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
      setDictionary(dictionaries[savedLanguage])
    }
    setMounted(true)
  }, [])

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    setDictionary(dictionaries[newLanguage])
    localStorage.setItem("language", newLanguage)
  }

  // Prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        dictionary={dictionaries[language]} 
        language={language}
        handleLanguageChange={handleLanguageChange}
      />

      <main className="flex-1">
        <section id="hero" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-6 md:px-12 lg:px-24">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    {dictionary.hero.greeting}
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">{dictionary.hero.description}</p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild>
                    <Link href="#contact">{dictionary.hero.getInTouch}</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="#projects">{dictionary.hero.viewWork}</Link>
                  </Button>
                </div>
                <div className="flex gap-4">
                  <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                    <Button onClick={goToGithub} variant="ghost" size="icon">
                      <Github className="h-5 w-5" />
                      <span className="sr-only">GitHub</span>
                    </Button>
                  </Link>
                  <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                    <Button onClick={goToLinkedin} variant="ghost" size="icon">
                      <Linkedin className="h-5 w-5" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </Link>
                  <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <Button onClick={goToInstagram} variant="ghost" size="icon">
                      <Instagram className="h-5 w-5" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src="/lucas.webp"
                  alt="Lucas"
                  width={400}
                  height={400}
                  className="rounded-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>
        <section id="about" className="w-full bg-muted py-12 md:py-24 lg:py-32">
          <div className="container px-6 md:px-12 lg:px-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{dictionary.about.title}</h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                {dictionary.about.paragraph1}
              </p>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                {dictionary.about.paragraph2}
              </p>
            </div>
          </div>
        </section>

        {/* <section>
          <MapTimeline/>
        </section> */}

        <PlayBar />
  
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 px-6 md:px-12 lg:px-24">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Lucas. {dictionary.footer.rights}
          </p>
          <div className="flex gap-4">
            <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
            <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <Linkedin className="h-4 w-4" />
                <span className="sr-only">LinkedIn</span>
              </Button>
            </Link>
            <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <Instagram className="h-4 w-4" />
                <span className="sr-only">Instagram</span>
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

