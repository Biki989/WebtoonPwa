import * as cheerio from 'cheerio'
import axios from 'axios'

/**
 * Scrape a source URL using its configured CSS selectors.
 * @param {Object} sourceConfig - Source configuration with selectors
 * @param {string} type - 'search' | 'title' | 'chapters' | 'reader'
 * @param {string} url - Full URL to scrape
 */
export async function scrape(sourceConfig, type, url) {
  if (sourceConfig.renderType === 'mangadex') {
    return scrapeMangaDex(type, url, sourceConfig)
  }

  const fullUrl = url.startsWith('http') ? url : `${sourceConfig.baseUrl}${url}`
  
  const response = await axios.get(fullUrl, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  })

  const $ = cheerio.load(response.data)
  const selectors = sourceConfig.selectors?.[type] || {}

  switch (type) {
    case 'search':
      return scrapeSearch($, selectors, sourceConfig)
    case 'title':
      return scrapeTitle($, selectors)
    case 'chapters':
      return scrapeChapters($, selectors)
    case 'reader':
      return scrapeReader($, selectors)
    default:
      throw new Error(`Unknown scrape type: ${type}`)
  }
}

function scrapeSearch($, sel, source) {
  const items = []
  $(sel.itemContainer || '.search-item').each((i, el) => {
    const $el = $(el)
    items.push({
      title: $el.find(sel.titleText || '.title').text().trim(),
      link: $el.find(sel.titleLink || 'a').attr('href'),
      cover: $el.find(sel.coverImage || 'img').attr(sel.coverAttr || 'src'),
      latestChapter: $el.find(sel.latestChapter || '.latest').text().trim(),
      rating: $el.find(sel.rating || '.rating').text().trim(),
      sourceId: source.id,
      sourceName: source.name
    })
  })
  return items
}

function scrapeTitle($, sel) {
  return {
    title: $(sel.titleName || 'h1').text().trim(),
    cover: $(sel.coverImage || '.cover img').attr(sel.coverAttr || 'src'),
    description: $(sel.description || '.synopsis').text().trim(),
    genres: $(sel.genreTags || '.genre').map((i, el) => $(el).text().trim()).get(),
    status: $(sel.status || '.status').text().trim(),
    author: $(sel.author || '.author').text().trim()
  }
}

function scrapeChapters($, sel) {
  const chapters = []
  $(sel.chapterItem || '.chapter-item').each((i, el) => {
    const $el = $(el)
    chapters.push({
      number: $el.find(sel.chapterNumber || '.num').text().trim(),
      title: $el.find(sel.chapterTitle || '.ch-title').text().trim(),
      link: $el.find(sel.chapterLink || 'a').attr('href'),
      releaseDate: $el.find(sel.releaseDate || '.date').text().trim()
    })
  })
  return chapters
}

function scrapeReader($, sel) {
  const images = $(imageSelector).map((i, el) => $(el).attr(imageAttr)).get().filter(Boolean)
  return { images }
}

// Native MangaDex API integration
async function scrapeMangaDex(type, url, sourceConfig) {
  const headers = { 'User-Agent': 'WebtoonPWA/1.0' }
  const baseUrl = 'https://api.mangadex.org'

  switch(type) {
    case 'search': {
      // url is actually the query here because searchUrlTemplate replaces {query}
      // But in api.search, backend passes full built URL if we had a template.
      // We will just assume URL contains the query string if it's full URL
      const q = new URL(url, 'http://localhost').searchParams.get('title') || url.split('/').pop()
      const ratings = '&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic'
      const res = await axios.get(`${baseUrl}/manga?title=${encodeURIComponent(q)}&includes[]=cover_art&limit=15${ratings}`, { headers })
      return res.data.data.map(manga => {
        const title = manga?.attributes?.title?.en || Object.values(manga?.attributes?.title || {})[0] || 'Unknown'
        const coverRel = manga.relationships.find(r => r.type === 'cover_art')
        const coverUrl = coverRel ? `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.256.jpg` : ''
        return {
          title,
          link: manga.id,
          cover: coverUrl,
          latestChapter: '',
          rating: '',
          sourceId: sourceConfig.id,
          sourceName: sourceConfig.name
        }
      })
    }
    case 'title': {
      const mangaId = url
      const res = await axios.get(`${baseUrl}/manga/${mangaId}?includes[]=cover_art&includes[]=author`, { headers })
      const manga = res.data.data
      const title = manga?.attributes?.title?.en || Object.values(manga?.attributes?.title || {})[0] || 'Unknown'
      const coverRel = manga.relationships?.find(r => r.type === 'cover_art')
      const coverUrl = coverRel ? `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.512.jpg` : ''
      const authorRel = manga.relationships?.find(r => r.type === 'author')
      
      let authorName = ''
      if (authorRel) {
        try {
          const authorRes = await axios.get(`${baseUrl}/author/${authorRel.id}`)
          authorName = authorRes.data.data.attributes.name
        } catch { /* skip */ }
      }

      return {
        title,
        cover: coverUrl,
        description: manga?.attributes?.description?.en || Object.values(manga?.attributes?.description || {})[0] || '',
        genres: (manga?.attributes?.tags || []).map(t => t?.attributes?.name?.en).filter(Boolean),
        status: manga?.attributes?.status || 'Unknown',
        author: authorName
      }
    }
    case 'chapters': {
      const mangaId = url
      let chapters = []
      let offset = 0
      // fetch up to 100 recent chapters. content-rating must be explicitly requested
      const ratings = '&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic'
      const res = await axios.get(`${baseUrl}/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=100&offset=${offset}${ratings}`, { headers })
      for (const c of res.data.data) {
        chapters.push({
          number: c?.attributes?.chapter || '0',
          title: c?.attributes?.title || '',
          link: c.id,
          releaseDate: c?.attributes?.publishAt || new Date().toISOString()
        })
      }
      return chapters
    }
    case 'reader': {
      const chapterId = url
      const res = await axios.get(`${baseUrl}/at-home/server/${chapterId}`, { headers })
      const host = res.data.baseUrl
      const hash = res.data.chapter.hash
      const images = res.data.chapter.data.map(i => `${host}/data/${hash}/${i}`)
      return { images }
    }
  }
}
