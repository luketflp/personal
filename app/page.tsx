import { cookies, headers } from 'next/headers'
import HomeClient from './home-client'
import {
  detectRequestLanguage,
  isLanguage,
  LANGUAGE_COOKIE,
} from '@/lib/i18n/language'

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function Home({ searchParams }: HomePageProps) {
  const [params, requestHeaders, cookieStore] = await Promise.all([
    searchParams,
    headers(),
    cookies(),
  ])
  const requestedLanguage = firstValue(params.lang)
  const savedLanguage = cookieStore.get(LANGUAGE_COOKIE)?.value
  const initialLanguage = isLanguage(requestedLanguage)
    ? requestedLanguage
    : isLanguage(savedLanguage)
      ? savedLanguage
      : detectRequestLanguage({
          country: requestHeaders.get('x-vercel-ip-country'),
          acceptLanguage: requestHeaders.get('accept-language'),
        })

  return <HomeClient initialLanguage={initialLanguage} />
}
