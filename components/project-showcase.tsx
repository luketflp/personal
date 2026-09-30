'use client'

import { ArrowRight, Globe2, MousePointer2 } from 'lucide-react'
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import type { ProfileCopy } from '@/lib/profile-copy'
import { cn } from '@/lib/utils'
import binamikDesktop from '@/assets/projects/binamik-desktop.jpg'
import binamikMobile from '@/assets/projects/binamik-mobile.jpg'
import roxoDesktop from '@/assets/projects/roxo-desktop.jpg'
import roxoMobile from '@/assets/projects/roxo-mobile.jpg'

type Project = ProfileCopy['projects'][number]

// Screenshots of each live site, keyed by title (same in every language).
// The mobile one is a full-page capture so the phone can scroll through it.
const PREVIEWS: Record<
  string,
  { desktop: StaticImageData; mobile: StaticImageData }
> = {
  'Binamik Photos': { desktop: binamikDesktop, mobile: binamikMobile },
  'Roxo Events': { desktop: roxoDesktop, mobile: roxoMobile },
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const EASE_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)'

// The scene is designed on a 756x560 stage and positioned in percentages so
// it scales with the column. SCREEN_W/H give the phone screen's proportions
// and the scale the scroll speed is measured at.
const SCREEN_W = 216
const SCREEN_H = 472
const SCROLL_PX_PER_S = 220

type ProjectShowcaseProps = {
  projects: Project[]
  hoverHint: string
  scrollingHint: string
}

export function ProjectShowcase({
  projects,
  hoverHint,
  scrollingHint,
}: ProjectShowcaseProps) {
  return (
    <div className="mt-12 space-y-20 md:mt-16 md:space-y-28">
      {projects.map((project, index) => (
        <ProjectRow
          key={project.title}
          project={project}
          index={index}
          hoverHint={hoverHint}
          scrollingHint={scrollingHint}
        />
      ))}
    </div>
  )
}

type ProjectRowProps = {
  project: Project
  index: number
  hoverHint: string
  scrollingHint: string
}

function ProjectRow({
  project,
  index,
  hoverHint,
  scrollingHint,
}: ProjectRowProps) {
  const reduce = useReducedMotion() ?? false
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: 0.6 })
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [canHover, setCanHover] = useState(true)

  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover)').matches)
  }, [])

  // Touch screens have no hover, so the row opens once it scrolls into view.
  // Reduced motion shows the open state without any movement.
  const open = reduce || hovered || focused || (!canHover && inView)
  const scrolling = open && !reduce

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateY = useTransform(
    useSpring(mx, { stiffness: 150, damping: 20 }),
    v => v * 8,
  )
  const rotateX = useTransform(
    useSpring(my, { stiffness: 150, damping: 20 }),
    v => v * -6,
  )

  const onStageMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    mx.set((event.clientX - rect.left) / rect.width - 0.5)
    my.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  const onLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return
    setHovered(false)
    mx.set(0)
    my.set(0)
  }

  const rowIn: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: EASE },
    },
  }
  const sceneIn: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 40, rotateX: reduce ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.9, delay: 0.15, ease: EASE },
    },
  }

  const preview = PREVIEWS[project.title]
  const flip = index % 2 === 1
  const sign = flip ? -1 : 1
  const projectIndex = String(index + 1).padStart(2, '0')

  let stage = null
  if (preview) {
    const { mobile } = preview
    const imageHeight = (SCREEN_W * mobile.height) / mobile.width
    const scrollPercent = (1 - SCREEN_H / imageHeight) * 100
    const scrollSeconds = (imageHeight - SCREEN_H) / SCROLL_PX_PER_S

    const browserStyle: CSSProperties = {
      left: flip ? '17.46%' : '3.17%',
      opacity: scrolling ? 0.9 : 1,
      transform: scrolling
        ? `translate3d(${-12 * sign}px, 6px, -60px) rotateY(${10 * sign}deg)`
        : 'translate3d(0px, 0px, 0px) rotateY(0deg)',
      boxShadow: open
        ? '0 20px 40px -30px rgb(2 8 23 / 0.2)'
        : '0 30px 60px -40px rgb(2 8 23 / 0.25)',
    }
    const phoneStyle: CSSProperties = {
      left: flip ? '7%' : '64%',
      padding: '1.23%',
      borderRadius: '17.8% / 8.54%',
      transform: open
        ? `translate3d(${-28 * sign}px, -4px, 150px) rotateY(${-8 * sign}deg) rotateX(3deg) rotateZ(0deg)`
        : // z stays high at rest so the turned phone never cuts through the browser
          `translate3d(0px, 12px, 110px) rotateY(${-26 * sign}deg) rotateX(10deg) rotateZ(${3 * sign}deg)`,
      boxShadow: open
        ? '0 40px 60px -30px rgb(2 8 23 / 0.4), 0 16px 32px -16px rgb(2 8 23 / 0.3)'
        : '0 24px 48px -24px rgb(2 8 23 / 0.35)',
    }
    const screenImageStyle: CSSProperties = {
      transform: `translateY(${scrolling ? -scrollPercent : 0}%)`,
      transition: scrolling
        ? `transform ${scrollSeconds.toFixed(1)}s linear 0.6s`
        : `transform 0.9s ${EASE_CSS}`,
    }
    const sceneTransition =
      'transition-[transform,opacity,box-shadow] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]'

    stage = (
      <div
        aria-hidden
        onPointerMove={onStageMove}
        className={cn(
          'relative order-first aspect-[756/560] w-full rounded-[28px] border bg-muted/40 [background-image:radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:22px_22px] [perspective:1600px]',
          !flip && 'lg:order-last',
        )}
      >
        <motion.div
          className="absolute inset-0 [transform-style:preserve-3d]"
          variants={sceneIn}
        >
          <motion.div
            className="absolute inset-0 [transform-style:preserve-3d]"
            style={{ rotateX, rotateY }}
          >
            <div
              className={cn(
                'absolute top-[10%] w-[79.37%] overflow-hidden rounded-[14px] border bg-background',
                sceneTransition,
              )}
              style={browserStyle}
            >
              <div className="flex h-7 items-center gap-3 border-b bg-muted/60 px-3 md:h-8">
                <div className="flex w-10 gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                </div>
                {project.url && (
                  <span className="mx-auto truncate rounded-md border bg-background px-3 py-0.5 font-mono text-[10px] text-muted-foreground md:text-[11px]">
                    {new URL(project.url).host.replace(/^www\./, '')}
                  </span>
                )}
                <div className="w-10" />
              </div>
              <Image
                src={preview.desktop}
                alt=""
                placeholder="blur"
                sizes="(min-width: 1024px) 600px, 80vw"
                className="aspect-[16/10] w-full object-cover object-top"
              />
            </div>

            <div
              className={cn(
                'absolute top-[8%] aspect-[236/492] w-[29%] bg-slate-900',
                sceneTransition,
              )}
              style={phoneStyle}
            >
              <span className="absolute -left-[3px] top-[21%] h-[5.3%] w-[3px] rounded-sm bg-slate-800" />
              <span className="absolute -left-[3px] top-[29%] h-[9.3%] w-[3px] rounded-sm bg-slate-800" />
              <span className="absolute -right-[3px] top-[26%] h-[13%] w-[3px] rounded-sm bg-slate-800" />
              <div className="relative h-full w-full overflow-hidden rounded-[14.8%/6.78%] bg-white">
                <Image
                  src={mobile}
                  alt=""
                  sizes="(min-width: 1024px) 216px, 28vw"
                  className="h-auto w-full"
                  style={screenImageStyle}
                />
                <span className="absolute left-1/2 top-[2.1%] h-[4.2%] w-[33%] -translate-x-1/2 rounded-full bg-slate-900" />
                <span
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.22)_0%,transparent_40%)] transition-opacity duration-[900ms]"
                  style={{ opacity: open ? 0.4 : 1 }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {!reduce && (
          <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground xl:[@media(hover:hover)]:inline-flex">
            {open ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                {scrollingHint}
              </>
            ) : (
              <>
                <MousePointer2 className="h-3.5 w-3.5" />
                {hoverHint}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.article
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={rowIn}
      onPointerEnter={event => {
        if (event.pointerType === 'mouse') setHovered(true)
      }}
      onPointerLeave={onLeave}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn(
        'grid items-center gap-8 lg:gap-16',
        preview &&
          (flip
            ? 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'
            : 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'),
      )}
    >
      {stage}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-medium">{projectIndex}</span>
          <span
            className={cn(
              'h-px transition-all duration-500 ease-out',
              open ? 'w-16 bg-foreground' : 'w-8 bg-border',
            )}
          />
        </div>
        <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {project.title}
        </h3>
        <p className="text-sm leading-7 text-muted-foreground md:text-base">
          {project.description}
        </p>
        <ul className="flex flex-wrap gap-2">
          {project.stack.map(tech => (
            <li
              key={tech}
              className="rounded-lg border border-border/60 bg-background/65 px-3 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {tech}
            </li>
          ))}
        </ul>
        {project.url && (
          <Link
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <Globe2 className="h-3.5 w-3.5" />
            {project.url.replace('https://', '')}
            <ArrowRight
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-500',
                open && !reduce && 'translate-x-1',
              )}
            />
          </Link>
        )}
      </div>
    </motion.article>
  )
}
