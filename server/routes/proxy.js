import { Router } from 'express'
import axios from 'axios'

const router = Router()

// GET /api/proxy?url=imageUrl
router.get('/', async (req, res) => {
  try {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'url parameter required' })

    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(url).origin
      }
    })

    // Forward content type
    const contentType = response.headers['content-type'] || 'image/jpeg'
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // 24h cache
      'Access-Control-Allow-Origin': '*'
    })

    response.data.pipe(res)
  } catch (err) {
    res.status(502).json({ error: `Proxy error: ${err.message}` })
  }
})

export { router as proxyRouter }
