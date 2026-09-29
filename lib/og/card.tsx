import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const OG_SIZE = { width: 1200, height: 630 }

// Literal process.cwd() joins so Vercel's output file tracing bundles the
// assets into the serverless function (see outputFileTracingIncludes too).
export async function loadOgAssets() {
  const [photo, inter, interSemiBold, interBold] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'hero-me.png')),
    readFile(
      join(process.cwd(), 'assets', 'fonts', 'inter', 'latin-400-normal.ttf'),
    ),
    readFile(
      join(process.cwd(), 'assets', 'fonts', 'inter', 'latin-600-normal.ttf'),
    ),
    readFile(
      join(process.cwd(), 'assets', 'fonts', 'inter', 'latin-700-normal.ttf'),
    ),
  ])
  return {
    photoSrc: `data:image/png;base64,${photo.toString('base64')}`,
    fonts: [
      {
        name: 'Inter',
        data: inter,
        weight: 400 as const,
        style: 'normal' as const,
      },
      {
        name: 'Inter',
        data: interSemiBold,
        weight: 600 as const,
        style: 'normal' as const,
      },
      {
        name: 'Inter',
        data: interBold,
        weight: 700 as const,
        style: 'normal' as const,
      },
    ],
  }
}

// Site palette (app/globals.css, light theme)
const FG = '#0F172A'
const MUTED = '#64748B'
const BORDER = '#E2E8F0'

const STACK = ['React', 'Next.js', 'TypeScript', 'Rails', 'AWS']

export function OgCard({
  photoSrc,
  name,
  subtitle,
  title,
  lead,
  eyebrow,
}: {
  photoSrc: string
  name: string
  subtitle: string
  title: string
  lead?: string
  eyebrow?: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        fontFamily: 'Inter',
        color: FG,
        backgroundColor: '#FFFFFF',
        backgroundImage:
          'radial-gradient(circle at 0% 100%, rgba(15,23,42,0.06), transparent 45%)',
      }}
    >
      {/* Header bar, mirrors the site nav */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1200,
          height: 104,
          padding: '0 72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            {`> ${name}`}
            <div
              style={{
                display: 'flex',
                width: 15,
                height: 30,
                marginLeft: 3,
                background: FG,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 6,
              fontSize: 17,
              color: MUTED,
            }}
          >
            {subtitle}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 20, color: MUTED }}>
          lucasalexander.com.br
        </div>
      </div>

      {/* Copy */}
      <div
        style={{
          position: 'absolute',
          left: 72,
          top: 104,
          width: 640,
          height: 526,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {eyebrow && (
          <div style={{ display: 'flex', marginBottom: 22 }}>
            <div
              style={{
                display: 'flex',
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${BORDER}`,
                background: '#F8FAFC',
                fontSize: 17,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 3,
                color: MUTED,
              }}
            >
              {eyebrow}
            </div>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        {lead && (
          <div
            style={{
              display: 'flex',
              marginTop: 14,
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: -1.2,
              lineHeight: 1.15,
            }}
          >
            {lead}
          </div>
        )}
        <div style={{ display: 'flex', marginTop: 44 }}>
          {STACK.map(item => (
            <div
              key={item}
              style={{
                display: 'flex',
                marginRight: 10,
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${BORDER}`,
                background: '#FFFFFF',
                fontSize: 19,
                color: MUTED,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Photo cropped at the waist, like the hero */}
      <div
        style={{
          position: 'absolute',
          right: 24,
          top: 120,
          width: 480,
          height: 510,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <img src={photoSrc} width={480} height={640} />
      </div>
    </div>
  )
}
