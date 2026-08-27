export interface CountryGuideInfo {
  title: string
  extract: string
  thumbnail?: string
  pageUrl: string
  lang: 'pt' | 'en'
}

const cache = new Map<string, Promise<CountryGuideInfo | null>>()

interface LangLinksResponse {
  query?: {
    pages?: Record<string, { langlinks?: { lang: string; '*': string }[] }>
  }
}

interface SummaryResponse {
  extract?: string
  thumbnail?: { source: string }
  content_urls?: { desktop?: { page?: string } }
  type?: string
}

async function fetchPortugueseTitle(englishName: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(englishName)}&prop=langlinks&lllang=pt&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as LangLinksResponse
  const pages = data.query?.pages ?? {}
  const page = Object.values(pages)[0]
  return page?.langlinks?.[0]?.['*'] ?? null
}

async function fetchSummary(lang: 'pt' | 'en', title: string): Promise<CountryGuideInfo | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as SummaryResponse
  if (data.type === 'disambiguation' || !data.extract) return null
  return {
    title,
    extract: data.extract,
    thumbnail: data.thumbnail?.source,
    pageUrl: data.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    lang,
  }
}

async function loadCountryGuide(englishName: string): Promise<CountryGuideInfo | null> {
  try {
    const ptTitle = await fetchPortugueseTitle(englishName)
    if (ptTitle) {
      const ptSummary = await fetchSummary('pt', ptTitle)
      if (ptSummary) return ptSummary
    }
    return await fetchSummary('en', englishName)
  } catch {
    return null
  }
}

export function fetchCountryGuide(englishName: string): Promise<CountryGuideInfo | null> {
  if (!cache.has(englishName)) {
    cache.set(englishName, loadCountryGuide(englishName))
  }
  return cache.get(englishName)!
}

const SKIP_IMAGE_PATTERN = /flag|coat_of_arms|locator|orthographic|\.svg$|map|escudo|bandeira|brasão|logo|icon/i

interface ImagePage {
  title: string
  imageinfo?: { thumburl?: string; url?: string; width?: number }[]
}

interface ImagesResponse {
  query?: { pages?: Record<string, ImagePage> }
}

async function loadCountryPhotos(lang: 'pt' | 'en', title: string): Promise<string[]> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&generator=images&gimlimit=25&prop=imageinfo&iiprop=url|size&iiurlwidth=360&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as ImagesResponse
  const pages = Object.values(data.query?.pages ?? {})
  return pages
    .filter((p) => !SKIP_IMAGE_PATTERN.test(p.title))
    .map((p) => p.imageinfo?.[0])
    .filter((info): info is NonNullable<typeof info> => Boolean(info?.thumburl) && (info?.width ?? 0) > 200)
    .slice(0, 6)
    .map((info) => info.thumburl!)
}

const photoCache = new Map<string, Promise<string[]>>()

export function fetchCountryPhotos(lang: 'pt' | 'en', title: string): Promise<string[]> {
  const cacheKey = `${lang}:${title}`
  if (!photoCache.has(cacheKey)) {
    photoCache.set(cacheKey, loadCountryPhotos(lang, title).catch(() => []))
  }
  return photoCache.get(cacheKey)!
}
