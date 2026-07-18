import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { sourcesRouter } from './routes/sources.js'
import { scrapeRouter } from './routes/scrape.js'
import { proxyRouter } from './routes/proxy.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
})
app.use('/api/', limiter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/sources', sourcesRouter)
app.use('/api/scrape', scrapeRouter)
app.use('/api/proxy', proxyRouter)

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 WebtoonPWA Backend running at http://localhost:${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`)
})
