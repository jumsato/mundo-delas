export interface CountryGuideInfo {
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
