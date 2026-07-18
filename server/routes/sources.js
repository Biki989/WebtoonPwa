import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import { scrape } from '../lib/scraper.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCES_FILE = path.join(__dirname, '..', 'data', 'sources.json')

const router = Router()

async function readSources() {
  try {
    const data = await fs.readFile(SOURCES_FILE, 'utf-8')
    return JSON.parse(data)
  } catch { return [] }
}

async function writeSources(sources) {
  await fs.writeFile(SOURCES_FILE, JSON.stringify(sources, null, 2))
}

// GET /api/sources
router.get('/', async (req, res) => {
  const sources = await readSources()
  res.json(sources)
})

// POST /api/sources
router.post('/', async (req, res) => {
  const sources = await readSources()
  const newSource = {
    id: `src-${crypto.randomUUID().slice(0, 8)}`,
    ...req.body,
    enabled: true,
    createdAt: new Date().toISOString()
  }
  sources.push(newSource)
  await writeSources(sources)
  res.status(201).json(newSource)
})

// PUT /api/sources/:id
router.put('/:id', async (req, res) => {
  const sources = await readSources()
  const idx = sources.findIndex(s => s.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Source not found' })
  sources[idx] = { ...sources[idx], ...req.body }
  await writeSources(sources)
  res.json(sources[idx])
})

// DELETE /api/sources/:id
router.delete('/:id', async (req, res) => {
  let sources = await readSources()
  sources = sources.filter(s => s.id !== req.params.id)
  await writeSources(sources)
  res.json({ ok: true })
})

// POST /api/sources/test - Test a source config
router.post('/test', async (req, res) => {
  const source = req.body
  const results = {
    search: { status: 'pending', found: 0 },
    title: { status: 'pending', found: 0 },
    chapters: { status: 'pending', found: 0 },
    reader: { status: 'pending', found: 0 }
  }

  try {
    // 1. Test Search
    const searchUrl = source.selectors?.search?.urlTemplate?.replace('{query}', 'action')
    if (searchUrl) {
      const searchItems = await scrape(source, 'search', searchUrl)
      results.search = { status: 'success', found: searchItems.length }
      
      if (searchItems.length > 0) {
        const firstItem = searchItems[0]
        
        // 2. Test Title
        if (firstItem.link) {
          try {
            const titleData = await scrape(source, 'title', firstItem.link)
            results.title = { status: 'success', found: titleData.title ? 1 : 0 }
            
            // 3. Test Chapters
            const chapterData = await scrape(source, 'chapters', firstItem.link)
            results.chapters = { status: 'success', found: chapterData.length }
            
            // 4. Test Reader
            if (chapterData.length > 0 && chapterData[0].link) {
              try {
                const readerData = await scrape(source, 'reader', chapterData[0].link)
                results.reader = { status: 'success', found: readerData.images?.length || 0 }
              } catch (e) {
                results.reader = { status: 'error', error: e.message }
              }
            } else {
              results.reader = { status: 'error', error: 'No chapter link found to test reader' }
            }
          } catch (e) {
            results.title = { status: 'error', error: e.message }
            results.chapters = { status: 'error', error: 'Skipped due to title error' }
            results.reader = { status: 'error', error: 'Skipped due to title error' }
          }
        } else {
          results.title = { status: 'error', error: 'No link found in search results' }
        }
      }
    } else {
      results.search = { status: 'error', error: 'No search URL template configured' }
    }
    
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message, results })
  }
})

export { router as sourcesRouter }
