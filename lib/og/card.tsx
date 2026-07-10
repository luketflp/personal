import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const OG_SIZE = { width: 1200, height: 630 }

// Literal process.cwd() joins so Vercel's output file tracing bundles the
// assets into the serverless function (see outputFileTracingIncludes too).
export async function loadOgAssets() {
  const [photo, regular, semiBold, bold] = await Promise.all([
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
        data: regular,
        weight: 400 as const,
        style: 'normal' as const,
      },
      {
        name: 'Inter',
        data: semiBold,
        weight: 600 as const,
        style: 'normal' as const,
      },
      {
        name: 'Inter',
        data: bold,
        weight: 700 as const,
        style: 'normal' as const,
      },
    ],
  }
}

export function OgCard({
  photoSrc,
  name,
  subtitle,
  label,
  headline,
}: {
  photoSrc: string
  name: string
  subtitle: string
  label?: string
  headline?: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        fontFamily: 'Inter',
        background:
          'linear-gradient(135deg, #ffffff 0%, #eef2f7 55%, #dde5ee 100%)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: 72,
          paddingRight: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: -2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 14,
            paddingTop: 16,
            borderTop: '2px solid #cbd5e1',
            fontSize: 30,
            color: '#334155',
          }}
        >
          {subtitle}
        </div>
        {label && headline && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 72,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 20,
                textTransform: 'uppercase',
                letterSpacing: 8,
                color: '#64748b',
              }}
            >
              {label}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 10,
                fontSize: 38,
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              {headline}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          paddingRight: 56,
        }}
      >
        <img
          src={photoSrc}
          width={444}
          height={592}
          style={{ objectFit: 'cover', objectPosition: 'top' }}
        />
      </div>
    </div>
  )
}
