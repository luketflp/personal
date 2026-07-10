import { ImageResponse } from 'next/og'
import { OG_SIZE, OgCard, loadOgAssets } from '@/lib/og/card'
import { ISSUER } from '@/lib/quotes/issuer'

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
    />,
    { ...OG_SIZE, fonts },
  )
}
