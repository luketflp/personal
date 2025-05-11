"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import LanguageSwitcher from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { type Dictionary, type Language, dictionaries } from "@/lib/i18n/dictionaries"
import { Github, Instagram, Linkedin, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import TerminalTyping from "@/components/terminal-typing"
import MapTimeline from "@/components/map-timeline"
import Header from "./header"

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

        {/* <section id="skills" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-6 md:px-12 lg:px-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{dictionary.skills.title}</h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                {dictionary.skills.description}
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">{dictionary.skills.frontend.title}</h3>
                  <p className="text-center text-muted-foreground">{dictionary.skills.frontend.description}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
                      <line x1="8" y1="16" x2="8.01" y2="16" />
                      <line x1="8" y1="20" x2="8.01" y2="20" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                      <line x1="12" y1="22" x2="12.01" y2="22" />
                      <line x1="16" y1="16" x2="16.01" y2="16" />
                      <line x1="16" y1="20" x2="16.01" y2="20" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">{dictionary.skills.backend.title}</h3>
                  <p className="text-center text-muted-foreground">{dictionary.skills.backend.description}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">{dictionary.skills.tools.title}</h3>
                  <p className="text-center text-muted-foreground">{dictionary.skills.tools.description}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="projects" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-6 md:px-12 lg:px-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {dictionary.projects.title}
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                {dictionary.projects.description}
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-8 md:grid-cols-2">
              <Card className="overflow-hidden flex flex-col">
                <div className="relative h-48 w-full">
                  <Image src="/placeholder.svg?height=300&width=600" alt="Project 1" fill className="object-cover" />
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold">{dictionary.projects.project1.title}</h3>
                  <p className="text-muted-foreground mt-2 flex-1">{dictionary.projects.project1.description}</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="#" target="_blank" rel="noopener noreferrer">
                        {dictionary.projects.project1.viewDemo}
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="#" target="_blank" rel="noopener noreferrer">
                        {dictionary.projects.project1.github}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="overflow-hidden flex flex-col">
                <div className="relative h-48 w-full">
                  <Image src="/placeholder.svg?height=300&width=600" alt="Project 2" fill className="object-cover" />
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold">{dictionary.projects.project2.title}</h3>
                  <p className="text-muted-foreground mt-2 flex-1">{dictionary.projects.project2.description}</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href="#" target="_blank" rel="noopener noreferrer">
                        {dictionary.projects.project2.viewDemo}
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="#" target="_blank" rel="noopener noreferrer">
                        {dictionary.projects.project2.github}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="contact" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-6 md:px-12 lg:px-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {dictionary.contact.title}
              </h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                {dictionary.contact.description}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild>
                  <Link href="mailto:lucas@example.com">
                    <Mail className="mr-2 h-4 w-4" />
                    {dictionary.contact.emailMe}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="mr-2 h-4 w-4" />
                    {dictionary.contact.linkedin}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section> */}
  
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

