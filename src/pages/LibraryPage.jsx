import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutGrid, List, SlidersHorizontal, BookMarked, MoreVertical } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { TitleCard, EmptyState } from '../components/ui'
import { useLibraryStore } from '../stores'

const SHELVES = [
  { id: 'all', label: 'All' },
  { id: 'reading', label: 'Reading' },
  { id: 'plan', label: 'Plan to Read' },
  { id: 'completed', label: 'Completed' },
  { id: 'onhold', label: 'On Hold' },
  { id: 'dropped', label: 'Dropped' },
]

export default function LibraryPage() {
  const navigate = useNavigate()
  const { activeShelf, setActiveShelf, viewMode, setViewMode, sortBy, setSortBy } = useLibraryStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSort, setShowSort] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)

  // Load real bookmarks from Dexie
  const libraryTitles = useLiveQuery(() => db.bookmarks.toArray()) || []

  let filtered = activeShelf === 'all' ? libraryTitles : libraryTitles.filter(t => t.shelf === activeShelf)
  if (searchQuery) filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))

  // Sort
  if (sortBy === 'titleAZ') filtered.sort((a, b) => a.title.localeCompare(b.title))
  else if (sortBy === 'dateAdded') filtered.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0))
  else if (sortBy === 'lastUpdated') filtered.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)) // fallback
  else if (sortBy === 'lastRead') filtered.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)) // fallback

  const shelfCounts = SHELVES.map(s => ({
    ...s,
    count: s.id === 'all' ? libraryTitles.length : libraryTitles.filter(t => t.shelf === s.id).length
  }))

  return (
    <div className="min-h-screen fade-in">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 safe-top">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Library</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-card)] transition-colors">
              {viewMode === 'grid' ? <List size={18} className="text-[var(--color-text-secondary)]" /> : <LayoutGrid size={18} className="text-[var(--color-text-secondary)]" />}
            </button>
            <button onClick={() => setShowSort(!showSort)}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-card)] transition-colors">
              <SlidersHorizontal size={18} className="text-[var(--color-text-secondary)]" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search library..."
            className="w-full bg-[var(--color-bg-input)] text-[var(--color-text-primary)] text-sm rounded-xl py-2.5 pl-9 pr-3 outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40"
          />
        </div>

        {/* Sort Dropdown */}
        {showSort && (
          <div className="mb-3 p-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-glass-border)] slide-up">
            {[
              { id: 'lastRead', label: 'Last Read' },
              { id: 'lastUpdated', label: 'Last Updated' },
              { id: 'titleAZ', label: 'Title A–Z' },
              { id: 'dateAdded', label: 'Date Added' },
            ].map(opt => (
              <button key={opt.id} onClick={() => { setSortBy(opt.id); setShowSort(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === opt.id ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent-light)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shelf Tabs */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto hide-scrollbar">
        {shelfCounts.map(s => (
          <button key={s.id} onClick={() => setActiveShelf(s.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeShelf === s.id
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]'
            }`}>
            {s.label} <span className="ml-1 opacity-70">{s.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pb-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="Your library is empty"
            description="Browse titles and add them to your library to easily keep track of what you're reading."
            action="Browse Titles"
            onAction={() => navigate('/search')}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(t => (
              <div key={t.id} className="cursor-pointer group" onClick={() => navigate(`/title/${t.id}`)}
                onContextMenu={e => { e.preventDefault(); setContextMenu(t.id === contextMenu ? null : t.id) }}>
                <div className="relative rounded-xl overflow-hidden aspect-[3/4] mb-1.5 bg-[var(--color-bg-card)]">
                  <img src={t.cover} alt={t.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  {t.unreadCount > 0 && (
                    <div className="absolute top-1.5 right-1.5 min-w-[20px] h-5 flex items-center justify-center bg-[var(--color-error)] text-white text-[10px] font-bold px-1 rounded-full">
                      {t.unreadCount}
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded">
                    {t.sourceName}
                  </div>
                </div>
                <h3 className="text-[12px] font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-tight">{t.title}</h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => (
              <div key={t.id} onClick={() => navigate(`/title/${t.id}`)}
                className="flex gap-3 p-3 rounded-xl bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] transition-colors cursor-pointer">
                <img src={t.cover} alt={t.title} loading="lazy" className="w-12 h-16 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">{t.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-[var(--color-accent)]/20 text-[var(--color-accent-light)] px-1.5 py-0.5 rounded">{t.sourceId || 'Unknown Source'}</span>
                  </div>
                </div>
                {t.unreadCount > 0 && (
                  <div className="flex items-center">
                    <span className="min-w-[24px] h-6 flex items-center justify-center bg-[var(--color-error)] text-white text-[11px] font-bold rounded-full px-1.5">{t.unreadCount}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 slide-up">
            <div className="glass-strong rounded-t-2xl px-4 py-5 safe-bottom">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">
                {libraryTitles.find(t => t.titleId === contextMenu)?.title}
              </h3>
              {[
                { label: 'Move to Reading', action: async () => { await db.bookmarks.update(contextMenu, { shelf: 'reading' }); setContextMenu(null) } },
                { label: 'Move to Plan to Read', action: async () => { await db.bookmarks.update(contextMenu, { shelf: 'plan' }); setContextMenu(null) } },
                { label: 'Move to Completed', action: async () => { await db.bookmarks.update(contextMenu, { shelf: 'completed' }); setContextMenu(null) } },
                { label: 'Remove from Library', action: async () => { await db.bookmarks.delete(contextMenu); setContextMenu(null) } }
              ].map((item, i) => (
                <button key={i} onClick={item.action}
                  className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors ${i === 3 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'} hover:bg-[var(--color-bg-elevated)]`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
