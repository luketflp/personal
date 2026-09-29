import { ImageResponse } from 'next/og'
import { OG_SIZE, OgCard, loadOgAssets } from '@/lib/og/card'
import { ISSUER } from '@/lib/quotes/issuer'
import { PROFILE_COPY } from '@/lib/profile-copy'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Lucas Alexander — Software Engineer'

export default async function OpengraphImage() {
  const { photoSrc, fonts } = await loadOgAssets()

  return new ImageResponse(
    <OgCard
      photoSrc={photoSrc}
      name={ISSUER.name}
      subtitle={ISSUER.title.en}
      title={PROFILE_COPY.en.headlineLines[0]}
      lead={PROFILE_COPY.en.headline
        .slice(PROFILE_COPY.en.headlineLines[0].length)
        .trim()}
    />,
    { ...OG_SIZE, fonts },
  )
}
