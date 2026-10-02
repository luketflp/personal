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
  type ReactNode,
  type UIEvent,
} from 'react'
import type { ProfileCopy } from '@/lib/profile-copy'
import { cn } from '@/lib/utils'
import binamikDesktop from '@/assets/projects/binamik-desktop.jpg'
import binamikMobile from '@/assets/projects/binamik-mobile.jpg'
import nutripivaDesktop from '@/assets/projects/nutripiva-desktop.jpg'
import nutripivaMobile from '@/assets/projects/nutripiva-mobile.jpg'
import roxoDesktop from '@/assets/projects/roxo-desktop.jpg'
import roxoMobile from '@/assets/projects/roxo-mobile.jpg'

type Project = ProfileCopy['projects'][number]

// Screenshots of each live site, keyed by title (same in every language).
// The mobile one is a tall page capture so the phone can scroll through it.
const PREVIEWS: Record<
  string,
  { desktop: StaticImageData; mobile: StaticImageData }
> = {
  NutriPiva: { desktop: nutripivaDesktop, mobile: nutripivaMobile },
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
// How long the phone stays turned away while the screens swap.
const SWAP_MS = 360

const host = (url: string) => new URL(url).host.replace(/^www\./, '')

const fadeUp = (reduce: boolean): Variants => ({
  hidden: { opacity: 0, y: reduce ? 0 : 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
})

type ProjectShowcaseProps = {
  projects: Project[]
  hoverHint: string
  scrollingHint: string
}

export function ProjectShowcase(props: ProjectShowcaseProps) {
  return (
    <>
      <DesktopShowcase {...props} />
      <MobileShowcase projects={props.projects} />
    </>
  )
}

// One stage beside a list: picking a name swaps the screens on the stage.
function DesktopShowcase({
  projects,
  hoverHint,
  scrollingHint,
}: ProjectShowcaseProps) {
  const reduce = useReducedMotion() ?? false
  const [active, setActive] = useState(0)
  const [target, setTarget] = useState(0)
  const [open, setOpen] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const pick = (index: number) => {
    clearTimeout(timer.current)
    setOpen(true)
    setTarget(index)
    if (index === active || reduce) {
      setActive(index)
      setSwapping(false)
      return
    }
    // The phone turns away, the screens swap, then it turns back.
    setSwapping(true)
    timer.current = setTimeout(() => {
      setActive(index)
      setSwapping(false)
    }, SWAP_MS)
  }

  const close = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    clearTimeout(timer.current)
    setActive(target)
    setSwapping(false)
    setOpen(false)
  }

  const facing = reduce || (open && !swapping)
  const scrolling = open && !swapping && !reduce

  return (
    <motion.div
      className="mt-12 hidden md:mt-16 lg:block"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={fadeUp(reduce)}
      onPointerLeave={close}
    >
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-center gap-16">
        <ul className="border-t">
          {projects.map((item, index) => {
            const selected = index === target
            return (
              <li key={item.title} className="border-b">
                <button
                  type="button"
                  aria-current={selected || undefined}
                  onPointerEnter={event => {
                    if (event.pointerType === 'mouse') pick(index)
                  }}
                  onFocus={() => pick(index)}
                  onClick={() => pick(index)}
                  className="flex min-h-[72px] w-full items-center gap-4 text-left"
                >
                  <span
                    className={cn(
                      'font-mono text-sm font-medium transition-colors duration-300',
                      selected ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'h-px transition-all duration-500 ease-out',
                      selected ? 'w-12 bg-foreground' : 'w-5 bg-border',
                    )}
                  />
                  <span
                    className={cn(
                      'whitespace-nowrap text-xl font-semibold tracking-tight transition-colors duration-300 xl:text-2xl',
                      selected ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="ml-auto hidden text-sm text-muted-foreground xl:inline">
                    {item.kind}
                  </span>
                  <ArrowRight
                    className={cn(
                      'ml-auto h-4 w-4 shrink-0 transition-all duration-500 xl:ml-0',
                      selected ? 'opacity-100' : '-translate-x-1.5 opacity-0',
                    )}
                  />
                </button>
              </li>
            )
          })}
        </ul>

        <Stage
          items={projects}
          active={active}
          facing={facing}
          scrolling={scrolling}
          tilt
        >
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
        </Stage>
      </div>

      {/* Every project's details share one grid cell, so the strip is as tall
          as the longest one and the page doesn't jump when switching. */}
      <div
        className={cn(
          'mt-12 grid border-t pt-8 transition-opacity duration-300',
          swapping && 'opacity-0',
        )}
      >
        {projects.map((item, index) => (
          <div
            key={item.title}
            className={cn(
              'grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-16 [grid-area:1/1]',
              index !== active && 'invisible',
            )}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {item.kind}
              </p>
              <h3 className="text-4xl font-semibold tracking-tight">
                {item.title}
              </h3>
            </div>
            <div className="space-y-4">
              <p className="text-base leading-7 text-muted-foreground">
                {item.description}
              </p>
              <StackChips stack={item.stack} />
              {item.url && <ProjectLink url={item.url} />}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// Swipeable cards; the card in view turns its phone and scrolls it.
function MobileShowcase({ projects }: { projects: Project[] }) {
  const reduce = useReducedMotion() ?? false
  const track = useRef<HTMLDivElement>(null)
  const inView = useInView(track, { amount: 0.5 })
  const [current, setCurrent] = useState(0)

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    const card = el.firstElementChild as HTMLElement | null
    if (!card) return
    const step = card.offsetWidth + 16 // gap-4
    setCurrent(Math.min(projects.length - 1, Math.round(el.scrollLeft / step)))
  }

  return (
    <div className="mt-10 lg:hidden">
      <div
        ref={track}
        onScroll={onScroll}
        className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:-mx-12 md:scroll-px-12 md:px-12 [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((project, index) => {
          const on = inView && index === current
          return (
            <motion.article
              key={project.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp(reduce)}
              className="w-[85%] max-w-md shrink-0 snap-start space-y-5"
            >
              <Stage
                items={[project]}
                active={0}
                facing={reduce || on}
                scrolling={on && !reduce}
                scale={0.45}
                className="rounded-[22px] [background-size:18px_18px]"
              />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-medium">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="h-px w-8 bg-foreground" />
                  <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {project.kind}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">
                  {project.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {project.description}
                </p>
                <StackChips stack={project.stack} />
                {project.url && <ProjectLink url={project.url} />}
              </div>
            </motion.article>
          )
        })}
      </div>
      <div aria-hidden className="mt-6 flex justify-center gap-1.5">
        {projects.map((project, index) => (
          <span
            key={project.title}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index === current ? 'w-5 bg-foreground' : 'w-1.5 bg-border',
            )}
          />
        ))}
      </div>
    </div>
  )
}

type StageProps = {
  items: Project[]
  active: number
  facing: boolean
  scrolling: boolean
  // 1 = the 756px design stage; smaller stages shrink offsets and shadows.
  scale?: number
  tilt?: boolean
  className?: string
  children?: ReactNode
}

// Browser window plus phone in 3D. Every item's screenshots are stacked so
// switching `active` crossfades between them.
function Stage({
  items,
  active,
  facing,
  scrolling,
  scale = 1,
  tilt = false,
  className,
  children,
}: StageProps) {
  const reduce = useReducedMotion() ?? false
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

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!tilt || reduce || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    mx.set((event.clientX - rect.left) / rect.width - 0.5)
    my.set((event.clientY - rect.top) / rect.height - 0.5)
  }
  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  const px = (n: number) => `${n * scale}px`
  const current = items[active]

  const sceneIn: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 40, rotateX: reduce ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.9, delay: 0.15, ease: EASE },
    },
  }
  const browserStyle: CSSProperties = {
    opacity: scrolling ? 0.9 : 1,
    transform: scrolling
      ? `translate3d(${px(-12)}, ${px(6)}, ${px(-60)}) rotateY(10deg)`
      : 'translate3d(0px, 0px, 0px) rotateY(0deg)',
    boxShadow: facing
      ? `0 ${px(20)} ${px(40)} ${px(-30)} rgb(2 8 23 / 0.2)`
      : `0 ${px(30)} ${px(60)} ${px(-40)} rgb(2 8 23 / 0.25)`,
  }
  const phoneStyle: CSSProperties = {
    padding: '1.23%',
    borderRadius: '17.8% / 8.54%',
    transform: facing
      ? `translate3d(${px(-28)}, ${px(-4)}, ${px(150)}) rotateY(-8deg) rotateX(3deg) rotateZ(0deg)`
      : // z stays high at rest so the turned phone never cuts through the browser
        `translate3d(0px, ${px(12)}, ${px(110)}) rotateY(-26deg) rotateX(10deg) rotateZ(3deg)`,
    boxShadow: facing
      ? `0 ${px(40)} ${px(60)} ${px(-30)} rgb(2 8 23 / 0.4), 0 ${px(16)} ${px(32)} ${px(-16)} rgb(2 8 23 / 0.3)`
      : `0 ${px(24)} ${px(48)} ${px(-24)} rgb(2 8 23 / 0.35)`,
  }
  const sceneTransition =
    'transition-[transform,opacity,box-shadow] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]'

  return (
    <div
      aria-hidden
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ perspective: px(1600) }}
      className={cn(
        'relative aspect-[756/560] w-full rounded-[28px] border bg-muted/40 [background-image:radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:22px_22px]',
        className,
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
              'absolute left-[3.17%] top-[10%] w-[79.37%] overflow-hidden rounded-[14px] border bg-background',
              sceneTransition,
            )}
            style={browserStyle}
          >
            <div className="flex h-5 items-center gap-3 border-b bg-muted/60 px-2 lg:h-8 lg:px-3">
              <div className="flex w-10 gap-1 lg:gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-border lg:h-2 lg:w-2" />
                <span className="h-1.5 w-1.5 rounded-full bg-border lg:h-2 lg:w-2" />
                <span className="h-1.5 w-1.5 rounded-full bg-border lg:h-2 lg:w-2" />
              </div>
              {current.url && (
                <span className="mx-auto hidden truncate rounded-md border bg-background px-3 py-0.5 font-mono text-[11px] text-muted-foreground lg:block">
                  {host(current.url)}
                </span>
              )}
              <div className="hidden w-10 lg:block" />
            </div>
            <div className="relative aspect-[16/10] bg-muted">
              {items.map((item, index) => {
                const preview = PREVIEWS[item.title]
                if (!preview) return null
                return (
                  <Image
                    key={item.title}
                    src={preview.desktop}
                    alt=""
                    placeholder="blur"
                    sizes="(min-width: 1024px) 600px, 70vw"
                    className={cn(
                      'absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700',
                      index === active ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                )
              })}
            </div>
          </div>

          <div
            className={cn(
              'absolute left-[64%] top-[8%] aspect-[236/492] w-[29%] bg-slate-900',
              sceneTransition,
            )}
            style={phoneStyle}
          >
            <span className="absolute -left-[3px] top-[21%] h-[5.3%] w-[3px] rounded-sm bg-slate-800" />
            <span className="absolute -left-[3px] top-[29%] h-[9.3%] w-[3px] rounded-sm bg-slate-800" />
            <span className="absolute -right-[3px] top-[26%] h-[13%] w-[3px] rounded-sm bg-slate-800" />
            <div className="relative h-full w-full overflow-hidden rounded-[14.8%/6.78%] bg-white">
              {items.map((item, index) => {
                const preview = PREVIEWS[item.title]
                if (!preview) return null
                const { mobile } = preview
                const imageHeight = (SCREEN_W * mobile.height) / mobile.width
                const scrollPercent = (1 - SCREEN_H / imageHeight) * 100
                const scrollSeconds = (imageHeight - SCREEN_H) / SCROLL_PX_PER_S
                const live = index === active
                const run = live && scrolling
                return (
                  <Image
                    key={item.title}
                    src={mobile}
                    alt=""
                    sizes="(min-width: 1024px) 216px, 28vw"
                    className="absolute inset-x-0 top-0 h-auto w-full"
                    style={{
                      opacity: live ? 1 : 0,
                      transform: `translateY(${run ? -scrollPercent : 0}%)`,
                      transition: run
                        ? `opacity 0.5s ease, transform ${scrollSeconds.toFixed(1)}s linear 0.6s`
                        : `opacity 0.5s ease, transform 0.4s ${EASE_CSS}`,
                    }}
                  />
                )
              })}
              <span className="absolute left-1/2 top-[2.1%] h-[4.2%] w-[33%] -translate-x-1/2 rounded-full bg-slate-900" />
              <span
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.22)_0%,transparent_40%)] transition-opacity duration-[900ms]"
                style={{ opacity: facing ? 0.4 : 1 }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
      {children}
    </div>
  )
}

function StackChips({ stack }: { stack: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {stack.map(tech => (
        <li
          key={tech}
          className="rounded-lg border border-border/60 bg-background/65 px-3 py-1.5 text-xs font-medium text-muted-foreground"
        >
          {tech}
        </li>
      ))}
    </ul>
  )
}

function ProjectLink({ url }: { url: string }) {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
    >
      <Globe2 className="h-3.5 w-3.5" />
      {host(url)}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  )
}
