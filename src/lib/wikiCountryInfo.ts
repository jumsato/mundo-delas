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

interface SearchResponse {
  query?: { search?: { title: string }[] }
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

const DISAMBIGUATION_TITLE_PATTERN = /\((disambiguation|desambigua[cç][aã]o)\)$/i

// A bare place name (e.g. "Saitama", "Fukushima", "Matsumoto") often lands on
// a disambiguation page shared with a same-named city/prefecture/person, so
// we fall back to full-text search to find the actual article — skipping the
// disambiguation page itself, which search re-surfaces as the top hit for an
// exact-title query.
async function searchTitle(lang: 'pt' | 'en', query: string, exclude: string): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json&origin=*`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as SearchResponse
  const results = data.query?.search ?? []
  const hit = results.find((r) => r.title !== exclude && !DISAMBIGUATION_TITLE_PATTERN.test(r.title))
  return hit?.title ?? null
}

async function fetchSummary(
  lang: 'pt' | 'en',
  title: string,
  hint?: string,
  allowFallback = true,
): Promise<CountryGuideInfo | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const res = await fetch(url)
  if (res.ok) {
    const data = (await res.json()) as SummaryResponse
    if (data.type !== 'disambiguation' && data.extract) {
      return {
        title,
        extract: data.extract,
        thumbnail: data.thumbnail?.source,
        pageUrl: data.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        lang,
      }
    }
  }
  if (!allowFallback) return null
  const found = hint
    ? (await searchTitle(lang, `${title} ${hint}`, title)) ?? (await searchTitle(lang, title, title))
    : await searchTitle(lang, title, title)
  if (!found) return null
  return fetchSummary(lang, found, hint, false)
}

async function loadCountryGuide(englishName: string, hint?: string): Promise<CountryGuideInfo | null> {
  try {
    const ptTitle = await fetchPortugueseTitle(englishName)
    if (ptTitle) {
      const ptSummary = await fetchSummary('pt', ptTitle, hint)
      if (ptSummary) return ptSummary
    }
    return await fetchSummary('en', englishName, hint)
  } catch {
    return null
  }
}

export function fetchCountryGuide(englishName: string, hint?: string): Promise<CountryGuideInfo | null> {
  const cacheKey = hint ? `${englishName}::${hint}` : englishName
  if (!cache.has(cacheKey)) {
    cache.set(cacheKey, loadCountryGuide(englishName, hint))
  }
  return cache.get(cacheKey)!
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
