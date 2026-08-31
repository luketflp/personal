import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const OG_SIZE = { width: 1200, height: 630 }

// Literal process.cwd() joins so Vercel's output file tracing bundles the
// assets into the serverless function (see outputFileTracingIncludes too).
export async function loadOgAssets() {
  const [photo, inter, interSemiBold, spaceGrotesk] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'hero-me.png')),
    readFile(
      join(process.cwd(), 'assets', 'fonts', 'inter', 'latin-400-normal.ttf'),
    ),
    readFile(
      join(process.cwd(), 'assets', 'fonts', 'inter', 'latin-600-normal.ttf'),
    ),
    readFile(
      join(
        process.cwd(),
        'assets',
        'fonts',
        'space-grotesk',
        'latin-700-normal.ttf',
      ),
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
        name: 'Space Grotesk',
        data: spaceGrotesk,
        weight: 700 as const,
        style: 'normal' as const,
      },
    ],
  }
}

const INK = 'rgba(12, 12, 12, 0.96)'

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
        position: 'relative',
        fontFamily: 'Inter',
        background: '#FFFFFF',
      }}
    >
      {/* Soft dark shadow under the text block so light text reads on white */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 820,
          height: 630,
          background: `linear-gradient(90deg, ${INK} 0%, ${INK} 55%, rgba(12,12,12,0) 100%)`,
        }}
      />

      {/* Text block */}
      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 0,
          width: 600,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'Space Grotesk',
            fontSize: 68,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: -2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 22,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 34,
              height: 5,
              borderRadius: 3,
              background: '#8C8C8C',
              marginRight: 16,
            }}
          />
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: '#C9C9C9',
            }}
          >
            {subtitle}
          </div>
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
                fontSize: 18,
                textTransform: 'uppercase',
                letterSpacing: 7,
                color: '#9A9A9A',
              }}
            >
              {label}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 12,
                fontSize: 38,
                fontWeight: 600,
                color: '#F2F2F2',
              }}
            >
              {headline}
            </div>
          </div>
        )}
      </div>

      {/* Footer URL */}
      <div
        style={{
          position: 'absolute',
          left: 76,
          bottom: 42,
          display: 'flex',
          fontSize: 19,
          letterSpacing: 2,
          color: '#B0B0B0',
        }}
      >
        lucasalexander.com.br
      </div>

      {/* Photo */}
      <div
        style={{
          position: 'absolute',
          right: 44,
          bottom: 0,
          display: 'flex',
        }}
      >
        <img src={photoSrc} width={430} height={573} />
      </div>
    </div>
  )
}
