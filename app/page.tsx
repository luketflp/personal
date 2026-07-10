'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ContactForm } from '@/components/contact-form'
import { type Language, dictionaries } from '@/lib/i18n/dictionaries'
import { PROFILE_COPY } from '@/lib/profile-copy'
import {
  ArrowRight,
  Bot,
  Github,
  Globe2,
  Layers3,
  Linkedin,
  Server,
} from 'lucide-react'
import {
  SiGooglecloud,
  SiNextdotjs,
  SiPostgresql,
  SiPython,
  SiReact,
  SiRubyonrails,
  SiTypescript,
} from 'react-icons/si'
import { FaAws } from 'react-icons/fa6'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useEffect, useRef, useState } from 'react'
import { BackToQuote } from '@/components/back-to-quote'
import Header from './header'

const SOCIAL_LINKS = {
  github: 'https://github.com/luketflp',
  linkedin: 'https://www.linkedin.com/in/luca-soares/?locale=en',
} as const

// Typed easing tokens — framer-motion's stricter types need a 4-tuple bezier
// and literal easing keyword rather than the inferred number[] / string.
const HERO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const HERO_EASE_INOUT = 'easeInOut' as const

const HERO_STACK = [
  { label: 'React', Icon: SiReact },
  { label: 'Next.js', Icon: SiNextdotjs },
  { label: 'TypeScript', Icon: SiTypescript },
  { label: 'Rails', Icon: SiRubyonrails },
  { label: 'Python', Icon: SiPython },
  { label: 'PostgreSQL', Icon: SiPostgresql },
  { label: 'AWS', Icon: FaAws },
  { label: 'Google Cloud', Icon: SiGooglecloud },
  { label: 'LLM Agents', Icon: Bot },
] as const

const AMBIENT_SHAPES = [
  {
    className:
      '-left-24 top-6 h-56 w-56 bg-[radial-gradient(circle,hsl(var(--primary)/0.18),transparent_68%)]',
    animate: {
      x: [0, 26, -10, 0],
      y: [0, -18, 10, 0],
    },
    transition: {
      duration: 16,
      repeat: Number.POSITIVE_INFINITY,
      ease: HERO_EASE_INOUT,
    },
  },
  {
    className:
      'right-[-3rem] top-20 h-72 w-72 bg-[radial-gradient(circle,hsl(var(--foreground)/0.08),transparent_70%)]',
    animate: {
      x: [0, -18, 14, 0],
      y: [0, 22, -12, 0],
    },
    transition: {
      duration: 18,
      repeat: Number.POSITIVE_INFINITY,
      ease: HERO_EASE_INOUT,
    },
  },
  {
    className:
      'bottom-[-4rem] left-[35%] h-64 w-64 bg-[radial-gradient(circle,hsl(var(--primary)/0.12),transparent_68%)]',
    animate: {
      x: [0, -12, 18, 0],
      y: [0, 16, -10, 0],
    },
    transition: {
      duration: 20,
      repeat: Number.POSITIVE_INFINITY,
      ease: HERO_EASE_INOUT,
    },
  },
]

type HeroHeadlineWordProps = {
  word: string
  index: number
  total: number
  scrollYProgress: MotionValue<number>
  dissolveActive: boolean
  variants: Variants
}

function HeroHeadlineWord({
  word,
  index,
  total,
  scrollYProgress,
  dissolveActive,
  variants,
}: HeroHeadlineWordProps) {
  // Each word dissolves in a left-to-right wave over the same scroll
  // progress that scrubs the hero video, so copy and footage move together.
  const dissolveStart = 0.08 + (index / Math.max(total, 1)) * 0.42
  const dissolveEnd = dissolveStart + 0.22
  const opacity = useTransform(
    scrollYProgress,
    [dissolveStart, dissolveEnd],
    [1, 0.08],
  )
  const y = useTransform(
    scrollYProgress,
    [dissolveStart, dissolveEnd],
    [0, -18],
  )

  return (
    <motion.span
      className="mr-[0.28em] inline-block"
      custom={index}
      variants={variants}
    >
      <motion.span
        className="inline-block"
        style={dissolveActive ? { opacity, y } : undefined}
      >
        {word}
      </motion.span>
    </motion.span>
  )
}

export default function Home() {
  const [language, setLanguage] = useState<Language>('pt')
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const shouldReduceMotion = useReducedMotion() ?? false
  const heroRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end'],
  })

  useEffect(() => {
    // Coming from a quote (/?q=…&lang=…), match the quote's language;
    // don't persist it so the visitor's saved preference stays intact.
    const urlLanguage = new URLSearchParams(window.location.search).get(
      'lang',
    ) as Language | null
    if (urlLanguage && ['pt', 'en', 'es'].includes(urlLanguage)) {
      setLanguage(urlLanguage)
      return
    }
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && ['pt', 'en', 'es'].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const syncViewport = () => setIsDesktopViewport(mediaQuery.matches)

    syncViewport()

    mediaQuery.addEventListener('change', syncViewport)

    return () => {
      mediaQuery.removeEventListener('change', syncViewport)
    }
  }, [])

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  const dictionary = dictionaries[language]
  const profile = PROFILE_COPY[language]
  const strengths = [
    {
      icon: Layers3,
      ...profile.strengths[0],
    },
    {
      icon: Server,
      ...profile.strengths[1],
    },
    {
      icon: Globe2,
      ...profile.strengths[2],
    },
  ]
  let headlineWordCursor = 0
  const headlineLines = profile.headlineLines.map(line =>
    line.split(' ').map(word => ({ word, index: headlineWordCursor++ })),
  )
  const headlineWordTotal = headlineWordCursor
  const fadeInUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: HERO_EASE },
    },
  }

  const staggerChildren = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  }

  const revealWord = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 24,
      filter: shouldReduceMotion ? 'blur(0px)' : 'blur(12px)',
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.75,
        delay: shouldReduceMotion ? 0 : 0.08 + index * 0.035,
        ease: HERO_EASE,
      },
    }),
  }
  const sectionViewport = { once: true, amount: 0.2 }
  const heroCopyY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, shouldReduceMotion ? 0 : 92],
  )
  const heroGridOpacity = useTransform(scrollYProgress, [0, 1], [0.45, 0.18])
  const heroScale = useTransform(
    scrollYProgress,
    [0, 0.72, 1],
    [1, 0.98, shouldReduceMotion ? 1 : 0.92],
  )
  const heroOpacity = useTransform(
    scrollYProgress,
    [0, 0.7, 1],
    [1, 0.96, shouldReduceMotion ? 1 : 0.42],
  )
  // Desktop: portrait eases from a slight zoom-in to rest, anchored bottom.
  const heroImageScale = useTransform(
    scrollYProgress,
    [0, 1],
    [shouldReduceMotion ? 1 : 1.15, 1],
  )
  const cardHover = shouldReduceMotion
    ? {}
    : {
        whileHover: {
          y: -8,
          transition: { duration: 0.25, ease: HERO_EASE },
        },
      }

  return (
    <div id="top" className="flex min-h-screen flex-col bg-background">
      <Header
        dictionary={dictionary}
        language={language}
        handleLanguageChange={handleLanguageChange}
      />

      <Suspense fallback={null}>
        <BackToQuote language={language} />
      </Suspense>

      <main className="flex-1">
        <section
          ref={heroRef}
          className="relative min-h-[100svh] border-b lg:min-h-[180vh]"
        >
          <div className="flex min-h-[calc(100svh-4rem)] items-stretch lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)] lg:min-h-0">
            <div className="absolute inset-0 overflow-hidden [transform:translateZ(0)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_35%),radial-gradient(circle_at_bottom_right,hsl(var(--muted-foreground)/0.08),transparent_32%)]" />
              <motion.div
                className="absolute inset-0 opacity-70"
                style={{ opacity: heroGridOpacity }}
              >
                <div className="absolute inset-0 [background-image:linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
              </motion.div>
              {AMBIENT_SHAPES.map(shape => (
                <motion.div
                  key={shape.className}
                  className={`absolute rounded-full blur-3xl [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform] ${shape.className}`}
                  animate={shouldReduceMotion ? undefined : shape.animate}
                  transition={shouldReduceMotion ? undefined : shape.transition}
                />
              ))}
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)/0.78)_0%,hsl(var(--background)/0.36)_24%,hsl(var(--background)/0.46)_100%),linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/0.96)_32%,hsl(var(--background)/0.76)_52%,transparent_82%)]" />

            <div className="container relative z-10 flex h-full flex-col justify-end px-6 pb-0 pt-10 md:px-12 md:pb-6 md:pt-14 lg:px-24 lg:pb-0">
              <motion.div
                className="grid h-full gap-8 lg:items-end lg:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(420px,672px)]"
                style={
                  isDesktopViewport
                    ? { scale: heroScale, opacity: heroOpacity }
                    : undefined
                }
              >
                <motion.div
                  className="space-y-8 lg:self-start lg:pt-10 xl:pt-16"
                  initial="hidden"
                  animate="visible"
                  variants={staggerChildren}
                  style={isDesktopViewport ? { y: heroCopyY } : undefined}
                >
                  <motion.div className="space-y-4" variants={fadeInUp}>
                    <motion.h1
                      key={language}
                      className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[2.75rem]"
                      initial="hidden"
                      animate="visible"
                    >
                      {headlineLines.map((line, lineIndex) => (
                        <span
                          key={`${language}-line-${lineIndex}`}
                          className={
                            lineIndex === 0
                              ? 'inline font-extrabold tracking-tighter lg:block lg:whitespace-nowrap lg:text-5xl'
                              : 'inline lg:block lg:whitespace-nowrap'
                          }
                        >
                          {line.map(({ word, index }) => (
                            <HeroHeadlineWord
                              key={`${language}-${word}-${index}`}
                              word={word}
                              index={index}
                              total={headlineWordTotal}
                              scrollYProgress={scrollYProgress}
                              dissolveActive={
                                isDesktopViewport && !shouldReduceMotion
                              }
                              variants={revealWord}
                            />
                          ))}
                        </span>
                      ))}
                    </motion.h1>
                    <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                      {profile.summary}
                    </p>
                  </motion.div>
                  <motion.div
                    className="flex flex-col gap-3 sm:flex-row"
                    variants={fadeInUp}
                  >
                    <Button asChild size="lg">
                      <Link href="#contact">
                        {profile.primaryCta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link href="#projects">{profile.secondaryCta}</Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    className="flex flex-wrap gap-3 text-sm text-muted-foreground"
                    variants={fadeInUp}
                  >
                    <motion.div {...cardHover}>
                      <Link
                        href={SOCIAL_LINKS.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-4 py-2 shadow-sm backdrop-blur transition-colors hover:bg-accent"
                      >
                        <Github className="h-4 w-4" />
                        GitHub
                      </Link>
                    </motion.div>
                    <motion.div {...cardHover}>
                      <Link
                        href={SOCIAL_LINKS.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-4 py-2 shadow-sm backdrop-blur transition-colors hover:bg-accent"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </Link>
                    </motion.div>
                  </motion.div>
                  <motion.div
                    className="flex flex-wrap gap-2"
                    variants={fadeInUp}
                  >
                    {HERO_STACK.map(({ label, Icon }) => (
                      <motion.span
                        key={label}
                        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/65 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:border-border hover:text-foreground"
                        whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {label}
                      </motion.span>
                    ))}
                  </motion.div>
                </motion.div>
                <motion.div
                  className="relative hidden w-full items-end justify-end lg:flex lg:self-end"
                  initial={{
                    opacity: 0,
                    x: shouldReduceMotion ? 0 : 28,
                    scale: 1,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    transition: {
                      duration: 0.7,
                      delay: shouldReduceMotion ? 0 : 0.12,
                      ease: HERO_EASE,
                    },
                  }}
                >
                  <div className="pointer-events-none absolute inset-[-12%] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.14),transparent_26%),radial-gradient(circle_at_54%_46%,hsl(var(--primary)/0.18),transparent_32%),radial-gradient(circle_at_46%_72%,rgba(255,185,122,0.12),transparent_38%)] blur-3xl" />
                  <motion.div
                    className="relative aspect-[1086/1448] w-full origin-bottom-right will-change-transform lg:ml-auto lg:max-w-[42rem]"
                    style={{ scale: heroImageScale }}
                  >
                    <Image
                      src="/hero-me.png"
                      alt="Lucas Alexander, full-stack software engineer"
                      fill
                      priority
                      draggable={false}
                      sizes="(min-width: 1024px) 34rem, (min-width: 768px) 24rem, 24rem"
                      className="select-none object-contain object-bottom [-webkit-user-drag:none] lg:translate-x-[6%] lg:object-right-bottom"
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="relative z-10 -mt-10 rounded-t-[2.25rem] border-t bg-background/95 py-16 shadow-[0_-20px_80px_hsl(var(--foreground)/0.06)] backdrop-blur md:-mt-20 md:py-24"
        >
          <div className="container px-6 md:px-12 lg:px-24">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <motion.div
                className="space-y-5"
                initial="hidden"
                whileInView="visible"
                viewport={sectionViewport}
                variants={fadeInUp}
              >
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  {dictionary.about.title}
                </p>
                <p className="text-base leading-7 text-muted-foreground md:text-lg">
                  {dictionary.about.paragraph1}
                </p>
                <p className="text-base leading-7 text-muted-foreground md:text-lg">
                  {dictionary.about.paragraph2}
                </p>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={sectionViewport}
                variants={fadeInUp}
                {...cardHover}
              >
                <Card className="border-muted-foreground/20 bg-muted/40 shadow-[0_20px_60px_hsl(var(--foreground)/0.04)]">
                  <CardHeader>
                    <CardTitle>{profile.strengthsTitle}</CardTitle>
                    <CardDescription>
                      {dictionary.skills.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {strengths.map(strength => {
                      const Icon = strength.icon
                      return (
                        <motion.div
                          key={strength.title}
                          className="rounded-2xl border bg-background/80 p-4 shadow-sm"
                          initial="hidden"
                          whileInView="visible"
                          viewport={sectionViewport}
                          variants={fadeInUp}
                          whileHover={
                            shouldReduceMotion
                              ? undefined
                              : { y: -4, scale: 1.01 }
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-primary/10 p-2 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <h3 className="font-medium">{strength.title}</h3>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {strength.description}
                          </p>
                        </motion.div>
                      )
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="skills" className="border-y bg-muted/40 py-16 md:py-24">
          <div className="container px-6 md:px-12 lg:px-24">
            <motion.div
              className="mb-10 max-w-2xl space-y-3"
              initial="hidden"
              whileInView="visible"
              viewport={sectionViewport}
              variants={fadeInUp}
            >
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
                {dictionary.skills.title}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {profile.skillsHeading}
              </h2>
              <p className="text-base leading-7 text-muted-foreground md:text-lg">
                {dictionary.skills.description}
              </p>
            </motion.div>
            <motion.div
              className="grid gap-6 md:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={sectionViewport}
              variants={staggerChildren}
            >
              <motion.div variants={fadeInUp} {...cardHover}>
                <Card className="h-full overflow-hidden border-border/70 bg-background/85 shadow-[0_16px_40px_hsl(var(--foreground)/0.05)] backdrop-blur">
                  <motion.div
                    className="h-px w-full bg-[linear-gradient(90deg,transparent,hsl(var(--foreground)/0.24),transparent)]"
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: [0.45, 1, 0.45], scaleX: [0.84, 1, 0.84] }
                    }
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : {
                            duration: 3.4,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: HERO_EASE_INOUT,
                          }
                    }
                  />
                  <CardHeader>
                    <CardTitle>{dictionary.skills.frontend.title}</CardTitle>
                    <CardDescription>
                      {dictionary.skills.frontend.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
              <motion.div variants={fadeInUp} {...cardHover}>
                <Card className="h-full overflow-hidden border-border/70 bg-background/85 shadow-[0_16px_40px_hsl(var(--foreground)/0.05)] backdrop-blur">
                  <motion.div
                    className="h-px w-full bg-[linear-gradient(90deg,transparent,hsl(var(--foreground)/0.24),transparent)]"
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: [0.45, 1, 0.45], scaleX: [0.84, 1, 0.84] }
                    }
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : {
                            duration: 3.8,
                            delay: 0.2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: HERO_EASE_INOUT,
                          }
                    }
                  />
                  <CardHeader>
                    <CardTitle>{dictionary.skills.backend.title}</CardTitle>
                    <CardDescription>
                      {dictionary.skills.backend.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
              <motion.div variants={fadeInUp} {...cardHover}>
                <Card className="h-full overflow-hidden border-border/70 bg-background/85 shadow-[0_16px_40px_hsl(var(--foreground)/0.05)] backdrop-blur">
                  <motion.div
                    className="h-px w-full bg-[linear-gradient(90deg,transparent,hsl(var(--foreground)/0.24),transparent)]"
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: [0.45, 1, 0.45], scaleX: [0.84, 1, 0.84] }
                    }
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : {
                            duration: 4.1,
                            delay: 0.35,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: HERO_EASE_INOUT,
                          }
                    }
                  />
                  <CardHeader>
                    <CardTitle>{dictionary.skills.tools.title}</CardTitle>
                    <CardDescription>
                      {dictionary.skills.tools.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="projects" className="border-y py-16 md:py-24">
          <div className="container px-6 md:px-12 lg:px-24">
            <motion.div
              className="flex flex-col gap-6 border-b border-border/70 pb-8 md:flex-row md:items-end md:justify-between"
              initial="hidden"
              whileInView="visible"
              viewport={sectionViewport}
              variants={fadeInUp}
            >
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  {dictionary.projects.title}
                </p>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {profile.projectsHeading}
                </h2>
                <p className="text-base leading-7 text-muted-foreground md:text-lg">
                  {profile.projectsIntro}
                </p>
              </div>
              <Link
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                {profile.projectsRailCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div
              className="divide-y divide-border/70"
              initial="hidden"
              whileInView="visible"
              viewport={sectionViewport}
              variants={staggerChildren}
            >
              {profile.projects.map((project, index) => {
                const projectIndex = String(index + 1).padStart(2, '0')

                return (
                  <motion.div
                    key={project.title}
                    className="grid gap-6 py-8 transition-colors duration-300 hover:bg-muted/20 md:grid-cols-[88px_minmax(0,1fr)] md:gap-8 md:py-10"
                    variants={fadeInUp}
                  >
                    <div className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                      {projectIndex}
                    </div>
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:gap-8">
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                          {project.title}
                        </h3>
                        <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                          {project.description}
                        </p>
                        {project.url && (
                          <Link
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                          >
                            <Globe2 className="h-3.5 w-3.5" />
                            {project.url.replace('https://', '')}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                      <div className="flex items-start lg:justify-end">
                        <p className="max-w-xs text-sm leading-7 text-muted-foreground lg:text-right">
                          {project.stack.join(' / ')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        <section id="contact" className="border-t bg-muted/40 py-16 md:py-24">
          <div className="container px-6 md:px-12 lg:px-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={sectionViewport}
              variants={fadeInUp}
              className="grid items-center gap-10 md:grid-cols-2 lg:gap-16"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
                    {profile.contactTitle}
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {profile.contactHeading}
                  </h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link
                      href={SOCIAL_LINKS.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link
                      href={SOCIAL_LINKS.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {profile.contactSupport}
                </p>
              </div>

              <Card className="shadow-[0_24px_80px_hsl(var(--foreground)/0.07)]">
                <CardHeader>
                  <CardTitle>{dictionary.quoteRequest.title}</CardTitle>
                  <CardDescription>
                    {dictionary.quoteRequest.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm
                    copy={dictionary.quoteRequest}
                    language={language}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}
