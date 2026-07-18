import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, X, TrendingUp, Clock } from 'lucide-react'
import { TitleCard, GenrePill, EmptyState, SkeletonCard, HorizontalScroll } from '../components/ui'
import { GENRES } from '../utils/mockData'
import { useSearchStore } from '../stores'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import api from '../utils/api'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { query, setQuery, recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useSearchStore()
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeGenre, setActiveGenre] = useState(searchParams.get('genre') || '')
  const [filterSource, setFilterSource] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  
  const sources = useLiveQuery(() => db.sourcesLocal.filter(s => s.enabled).toArray()) || []
  const debouncedQuery = useDebounce(query, 500) // Increase debounce for real API

  useEffect(() => {
    let active = true
    
    const performSearch = async () => {
      if (debouncedQuery.length >= 2) {
        setIsSearching(true)
        try {
          const fetchedResults = await api.search(debouncedQuery, filterSource !== 'all' ? filterSource : undefined)
          if (!active) return
          
          let filtered = fetchedResults
          if (filterStatus !== 'all') filtered = filtered.filter(t => t.status?.toLowerCase() === filterStatus)
          setResults(filtered)
        } catch (e) {
          console.error("Search error:", e)
          if (active) setResults([])
        } finally {
          if (active) setIsSearching(false)
        }
      } else if (activeGenre) {
        // Genre browsing isn't supported by the generic backend easily across all sources, 
        // so we'll just clear results for now until a specific backend route is added.
        setResults([])
      } else {
        setResults([])
      }
    }
    
    performSearch()
    return () => { active = false }
  }, [debouncedQuery, filterSource, filterStatus, activeGenre])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) addRecentSearch(query.trim())
  }

  const handleGenreClick = (genre) => {
    setActiveGenre(g => g === genre ? '' : genre)
    setQuery('')
  }

  const trendingTags = ['Solo Leveling', 'Tower of God', 'One Piece', 'Jujutsu Kaisen', 'Lookism']
  const showDiscover = query.length === 0 && !activeGenre
  const showResults = query.length >= 2 || activeGenre

  return (
    <div className="fade-in min-h-screen">
      {/* Search Bar */}
      <div className="px-4 pt-4 pb-2 safe-top sticky top-0 z-30 bg-[var(--color-bg-primary)]">
        <form onSubmit={handleSubmit} className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, authors, genres..."
            autoFocus
            className="w-full bg-[var(--color-bg-input)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] rounded-xl py-3 pl-10 pr-10 text-sm outline-none ring-1 ring-transparent focus:ring-[var(--color-accent)]/40 transition-all"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors">
              <X size={16} className="text-[var(--color-text-muted)]" />
            </button>
          )}
        </form>
      </div>

      {/* Live Suggestions Dropdown */}
      {query.length >= 2 && query.length < 100 && !isSearching && results.length > 0 && results.length <= 5 && (
        <div className="mx-4 mb-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-glass-border)] overflow-hidden slide-up">
          {results.slice(0, 4).map(t => (
            <div key={t.id || t.link} onClick={() => { addRecentSearch(query); navigate(`/title/${encodeURIComponent(t.id || t.link)}`, { state: t }) }}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-bg-card-hover)] cursor-pointer transition-colors">
              <img src={api.getProxyUrl(t.cover)} alt="" className="w-8 h-11 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-1">{t.title}</p>
                {t.author && <p className="text-[11px] text-[var(--color-text-muted)]">{t.author}</p>}
              </div>
              <span className="text-[10px] bg-[var(--color-accent)]/20 text-[var(--color-accent-light)] px-1.5 py-0.5 rounded flex-shrink-0">{t.sourceName}</span>
            </div>
          ))}
          <div onClick={() => addRecentSearch(query)}
            className="px-3 py-2.5 text-sm text-[var(--color-accent-light)] hover:bg-[var(--color-bg-card-hover)] cursor-pointer transition-colors border-t border-[var(--color-divider)]">
            Search for "{query}" →
          </div>
        </div>
      )}

      {/* Discover State */}
      {showDiscover && (
        <div className="px-4 mt-2">
          {/* Trending Searches */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-[var(--color-accent)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Trending</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map(tag => (
                <button key={tag} onClick={() => setQuery(tag)}
                  className="px-3 py-1.5 bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] text-xs rounded-full hover:bg-[var(--color-bg-card-hover)] transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[var(--color-text-muted)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Searches</h3>
                </div>
                <button onClick={clearRecentSearches} className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-light)]">Clear</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(s => (
                  <div key={s} className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-bg-card)] rounded-full group">
                    <button onClick={() => setQuery(s)} className="text-xs text-[var(--color-text-secondary)]">{s}</button>
                    <button onClick={() => removeRecentSearch(s)} className="text-[var(--color-text-muted)] hover:text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browse by Genre */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Browse by Genre</h3>
            <div className="grid grid-cols-3 gap-2">
              {GENRES.map(g => (
                <button key={g} onClick={() => handleGenreClick(g)}
                  className="relative overflow-hidden rounded-xl py-6 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] transition-colors group">
                  <span className="relative z-10 text-sm font-medium text-[var(--color-text-primary)]">{g}</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent group-hover:from-[var(--color-accent)]/15 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results State */}
      {showResults && (
        <div className="px-4 mt-2">
          {/* Genre filter active */}
          {activeGenre && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-[var(--color-text-secondary)]">Genre:</span>
              <span className="px-3 py-1 bg-[var(--color-accent)] text-white text-xs rounded-full font-medium flex items-center gap-1">
                {activeGenre}
                <X size={12} className="cursor-pointer" onClick={() => setActiveGenre('')} />
              </span>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] text-xs px-3 py-1.5 rounded-lg outline-none border border-[var(--color-glass-border)]">
              <option value="all">All Sources</option>
              {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] text-xs px-3 py-1.5 rounded-lg outline-none border border-[var(--color-glass-border)]">
              <option value="all">All Status</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] text-xs px-3 py-1.5 rounded-lg outline-none border border-[var(--color-glass-border)]">
              <option value="relevance">Relevance</option>
              <option value="rating">Rating</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          {/* Result count */}
          <p className="text-xs text-[var(--color-text-muted)] mb-3">{results.length} result{results.length !== 1 ? 's' : ''} found</p>

          {/* Loading */}
          {isSearching ? (
            <div className="grid grid-cols-2 gap-3">
              {Array(6).fill(0).map((_, i) => (
                <div key={i}>
                  <div className="skeleton aspect-[3/4] rounded-xl mb-2" />
                  <div className="skeleton h-3 w-3/4 rounded mb-1" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {results.map(t => (
                <div key={t.id || t.link} onClick={() => navigate(`/title/${encodeURIComponent(t.id || t.link)}`, { state: t })}
                  className="cursor-pointer group">
                  <div className="relative rounded-xl overflow-hidden aspect-[3/4] mb-2 bg-[var(--color-bg-card)]">
                    <img src={api.getProxyUrl(t.cover)} alt={t.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded">{t.sourceName}</div>
                    {t.status && (
                      <div className="absolute bottom-2 left-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.status === 'Ongoing' ? 'bg-green-500/80' : 'bg-blue-500/80'} text-white`}>{t.status}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">{t.title}</h3>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="No results found"
              description="Try a different keyword or add a new source to discover more titles."
              action="Add Source"
              onAction={() => navigate('/add-source')}
            />
          )}
        </div>
      )}
    </div>
  )
}
