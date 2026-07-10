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

const NAVY = '#0D1B30'
const ACCENT = '#3E7BFA'

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
        background: 'linear-gradient(160deg, #F6F8FB 0%, #E7EDF5 100%)',
      }}
    >
      {/* Soft glow + hairline ring behind the photo */}
      <div
        style={{
          position: 'absolute',
          right: -10,
          top: 70,
          width: 500,
          height: 500,
          borderRadius: 250,
          background:
            'radial-gradient(circle, rgba(62,123,250,0.18) 0%, rgba(62,123,250,0) 68%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 52,
          top: 130,
          width: 396,
          height: 396,
          borderRadius: 198,
          border: '1px solid rgba(13,27,48,0.12)',
        }}
      />

      {/* Slanted navy identity panel + accent seam */}
      <div
        style={{
          position: 'absolute',
          left: -80,
          top: -140,
          width: 810,
          height: 910,
          background: `radial-gradient(circle at 22% 18%, #16294A 0%, ${NAVY} 58%)`,
          transform: 'rotate(-6deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 726,
          top: -140,
          width: 8,
          height: 910,
          background:
            'linear-gradient(180deg, rgba(62,123,250,0.95) 0%, rgba(62,123,250,0) 85%)',
          transform: 'rotate(-6deg)',
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
            color: '#F8FAFD',
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
              background: ACCENT,
              marginRight: 16,
            }}
          />
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: '#A7B8D4',
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
                color: '#7B92B8',
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
                color: '#EFF4FB',
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
          color: '#7B92B8',
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
