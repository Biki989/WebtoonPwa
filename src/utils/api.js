import { useAppStore } from '../stores'

const api = {
  async get(endpoint) {
    const baseUrl = useAppStore.getState().backendUrl
    const res = await fetch(`${baseUrl}${endpoint}`)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  async post(endpoint, data) {
    const baseUrl = useAppStore.getState().backendUrl
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  async put(endpoint, data) {
    const baseUrl = useAppStore.getState().backendUrl
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  async delete(endpoint) {
    const baseUrl = useAppStore.getState().backendUrl
    const res = await fetch(`${baseUrl}${endpoint}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  getProxyUrl(imageUrl) {
    const baseUrl = useAppStore.getState().backendUrl
    return `${baseUrl}/api/proxy?url=${encodeURIComponent(imageUrl)}`
  },

  // Source management
  getSources: () => api.get('/api/sources'),
  createSource: (source) => api.post('/api/sources', source),
  updateSource: (id, source) => api.put(`/api/sources/${id}`, source),
  deleteSource: (id) => api.delete(`/api/sources/${id}`),
  testSource: (source) => api.post('/api/sources/test', source),

  // Scraping
  search: (query, sourceId) => api.get(`/api/scrape/search?q=${encodeURIComponent(query)}${sourceId ? `&source=${sourceId}` : ''}`),
  getTitle: (sourceId, url) => api.get(`/api/scrape/title?source=${sourceId}&url=${encodeURIComponent(url)}`),
  getChapters: (sourceId, url) => api.get(`/api/scrape/chapters?source=${sourceId}&url=${encodeURIComponent(url)}`),
  getReader: (sourceId, url) => api.get(`/api/scrape/reader?source=${sourceId}&url=${encodeURIComponent(url)}`),

  // Health check
  health: () => api.get('/api/health')
}

export default api
