import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { TitleCard, HorizontalScroll, SectionHeader, GenrePill, ProgressBar, EmptyState } from '../components/ui'
import { GENRES } from '../utils/mockData'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import api from '../utils/api'

function ContinueReadingSection() {
  const navigate = useNavigate()
  // Fetch recent uncompleted progress
  const progress = useLiveQuery(() => db.progress.orderBy('updatedAt').reverse().toArray()) || []
  const recentProgress = progress.filter(p => !p.completed).slice(0, 10)

  if (recentProgress.length === 0) return null

  // We need the cover image from history to display nicely
  const history = useLiveQuery(() => db.history.toArray()) || []
  const enrichedProgress = recentProgress.map(p => {
    const h = history.find(h => h.titleId === p.titleId)
    return {
      ...p,
      cover: h?.cover,
      title: h?.titleName || 'Unknown Title',
      chapterName: h?.chapterName || p.chapterId,
      sourceId: h?.sourceId
    }
  })

  return (
    <section className="mb-6 px-4">
      <SectionHeader title="Continue Reading" />
      <HorizontalScroll>
        {enrichedProgress.map(p => (
          <div key={`${p.titleId}-${p.chapterId}`} className="flex-shrink-0 w-[130px] cursor-pointer group" onClick={() => navigate(`/reader/${encodeURIComponent(p.titleId)}/${encodeURIComponent(p.chapterId)}?source=${p.sourceId}`)}>
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] mb-2 bg-[var(--color-bg-card)]">
              {p.cover && <img src={api.getProxyUrl(p.cover)} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <div className="text-[10px] text-white/80 font-medium mb-1 line-clamp-1">{p.chapterName}</div>
                <ProgressBar value={p.totalPages > 0 ? (p.page / (p.totalPages - 1)) * 100 : 0} />
              </div>
            </div>
            <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] leading-tight line-clamp-1">{p.title}</h3>
          </div>
        ))}
      </HorizontalScroll>
    </section>
  )
}

function LibraryPicksSection() {
  const navigate = useNavigate()
  const bookmarks = useLiveQuery(() => db.bookmarks.orderBy('addedAt').reverse().limit(10).toArray()) || []

  if (bookmarks.length === 0) return null

  return (
    <section className="mb-6 px-4">
      <SectionHeader title="Recently Added to Library" onSeeAll={() => navigate('/library')} />
      <HorizontalScroll>
        {bookmarks.map(t => (
          <TitleCard key={t.titleId} title={{ ...t, id: t.titleId, cover: api.getProxyUrl(t.cover) }} subtitle={t.sourceId} />
        ))}
      </HorizontalScroll>
    </section>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  
  // Logic to show generic CTA if no bookmarks and no progress yet
  const hasHistory = useLiveQuery(() => db.history.count()) > 0
  const hasBookmarks = useLiveQuery(() => db.bookmarks.count()) > 0

  return (
    <div className="fade-in">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-3 safe-top">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-secondary)] flex items-center justify-center">
            <span className="text-white font-black text-sm">W</span>
          </div>
          <h1 className="text-xl font-extrabold gradient-text">WebtoonPWA</h1>
        </div>
      </header>

      {/* Discover CTA for new users */}
      {!hasHistory && !hasBookmarks && (
        <div className="mx-4 mb-6">
          <EmptyState
            icon={Search}
            title="Welcome to WebtoonPWA"
            description="Start by adding a source and searching for titles to read. Your progress and library will appear here."
            action="Find Titles"
            onAction={() => navigate('/search')}
          />
        </div>
      )}

      {/* Continue Reading */}
      <ContinueReadingSection />
      
      {/* Library Picks */}
      <LibraryPicksSection />

      {/* Browse by Genre - Simple pills */}
      <section className="mb-6 px-4">
        <SectionHeader title="Browse by Genre" />
        <HorizontalScroll>
          {GENRES.map(g => (
            <GenrePill key={g} genre={g} onClick={() => navigate(`/search?genre=${g}`)} />
          ))}
        </HorizontalScroll>
      </section>

      <div className="h-4" />
    </div>
  )
}
