import { Router } from 'express'
import NodeCache from 'node-cache'
import { scrape } from '../lib/scraper.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCES_FILE = path.join(__dirname, '..', 'data', 'sources.json')
const cache = new NodeCache({ stdTTL: 300 }) // 5 min default

const router = Router()

async function getSource(sourceId) {
  const data = await fs.readFile(SOURCES_FILE, 'utf-8')
  const sources = JSON.parse(data)
  return sources.find(s => s.id === sourceId && s.enabled)
}

// GET /api/scrape/search?q=query&source=sourceId
router.get('/search', async (req, res) => {
  try {
    const { q, source } = req.query
    if (!q) return res.status(400).json({ error: 'Query required' })
    
    const cacheKey = `search:${source || 'all'}:${q}`
    const cached = cache.get(cacheKey)
    if (cached) return res.json(cached)

    // Load sources
    const data = await fs.readFile(SOURCES_FILE, 'utf-8')
    const sources = JSON.parse(data).filter(s => s.enabled)
    
    if (sources.length === 0) {
      return res.json([])
    }

    const targetSources = source && source !== 'all' ? sources.filter(s => s.id === source) : sources
    
    // Scrape all targeted sources in parallel
    const promises = targetSources.map(s => {
      let searchUrl
      if (s.renderType === 'mangadex') {
        searchUrl = `?title=${encodeURIComponent(q)}`
      } else {
        searchUrl = s.selectors?.search?.urlTemplate?.replace('{query}', encodeURIComponent(q))
      }
      
      if (!searchUrl) return Promise.resolve([])
      return scrape(s, 'search', searchUrl).catch(err => {
        console.error(`Error scraping search on ${s.name}:`, err.message)
        return [] // Don't fail entire search if one source fails
      })
    })

    const resultsArray = await Promise.all(promises)
    const results = resultsArray.flat()
    
    cache.set(cacheKey, results)
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/scrape/title?source=id&url=titleUrl
router.get('/title', async (req, res) => {
  try {
    const { source, url } = req.query
    if (!source || !url) return res.status(400).json({ error: 'source and url required' })
    
    const cacheKey = `title:${source}:${url}`
    const cached = cache.get(cacheKey)
    if (cached) return res.json(cached)

    const sourceConfig = await getSource(source)
    if (!sourceConfig) return res.status(404).json({ error: 'Source not found' })

    const result = await scrape(sourceConfig, 'title', url)
    cache.set(cacheKey, result)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/scrape/chapters?source=id&url=titleUrl
router.get('/chapters', async (req, res) => {
  try {
    const { source, url } = req.query
    if (!source || !url) return res.status(400).json({ error: 'source and url required' })
    
    const cacheKey = `chapters:${source}:${url}`
    const cached = cache.get(cacheKey)
    if (cached) return res.json(cached)

    const sourceConfig = await getSource(source)
    if (!sourceConfig) return res.status(404).json({ error: 'Source not found' })

    const result = await scrape(sourceConfig, 'chapters', url)
    cache.set(cacheKey, result)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/scrape/reader?source=id&url=chapterUrl
router.get('/reader', async (req, res) => {
  try {
    const { source, url } = req.query
    if (!source || !url) return res.status(400).json({ error: 'source and url required' })
    
    const cacheKey = `reader:${source}:${url}`
    const cached = cache.get(cacheKey)
    if (cached) return res.json(cached)

    const sourceConfig = await getSource(source)
    if (!sourceConfig) return res.status(404).json({ error: 'Source not found' })

    const result = await scrape(sourceConfig, 'reader', url)
    cache.set(cacheKey, result, 120) // 2 min TTL for reader
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export { router as scrapeRouter }
