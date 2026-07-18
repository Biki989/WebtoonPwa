import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Share2, MoreVertical, BookmarkPlus, BookmarkCheck, Play, Download, ChevronDown, ChevronUp, Search, Loader2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import api from '../utils/api'
import { GenrePill, TitleCard, HorizontalScroll, SectionHeader } from '../components/ui'

export default function TitleDetailPage() {
  const { id } = useParams()
  const decodedId = decodeURIComponent(id)
  const navigate = useNavigate()
  const location = useLocation()
  
  const [title, setTitle] = useState(location.state || null)
  const [chapters, setChapters] = useState([])
  const [isLoading, setIsLoading] = useState(!location.state)
  const [activeTab, setActiveTab] = useState('overview')
  const [expandSynopsis, setExpandSynopsis] = useState(false)
  const [chapterSort, setChapterSort] = useState('newest')
  const [chapterSearch, setChapterSearch] = useState('')

  // Dexie bookmark
  const bookmark = useLiveQuery(() => db.bookmarks.get({ titleId: decodedId }), [decodedId])
  const isBookmarked = !!bookmark

  useEffect(() => {
    let active = true
    async function loadData() {
      try {
        let currentTitle = title
        if (!currentTitle) {
          const bm = await db.bookmarks.get({ titleId: decodedId })
          if (bm) {
            currentTitle = bm
            if (active) setTitle(bm)
          } else {
            if (active) setIsLoading(false)
            return // Can't fetch without sourceId
          }
        }
        
        if (currentTitle?.sourceId && decodedId) {
           const fullTitle = await api.getTitle(currentTitle.sourceId, decodedId)
           if (active) setTitle(prev => ({ ...prev, ...fullTitle }))
           
           const chs = await api.getChapters(currentTitle.sourceId, decodedId)
           if (active) setChapters(chs)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadData()
    return () => { active = false }
  }, [decodedId, title?.sourceId])

  const toggleBookmark = async () => {
    if (isBookmarked) {
      await db.bookmarks.delete(bookmark.id)
    } else {
      if (!title) return
      await db.bookmarks.add({
        titleId: decodedId,
        sourceId: title.sourceId || '',
        title: title.title,
        cover: title.cover,
        author: title.author,
        status: title.status,
        shelf: 'plan',
        unreadCount: chapters.length,
        addedAt: new Date().toISOString()
      })
    }
  }

  const filteredChapters = useMemo(() => {
    let chs = [...chapters]
    if (chapterSearch) chs = chs.filter(c => (c.number && `Chapter ${c.number}`.toLowerCase().includes(chapterSearch.toLowerCase())) || (c.title && c.title.toLowerCase().includes(chapterSearch.toLowerCase())))
    // Reverse logic because often default from scraper is newest first (index 0)
    if (chapterSort === 'oldest') chs.reverse() // naive sort
    return chs
  }, [chapters, chapterSort, chapterSearch])

  const relatedTitles = []

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'chapters', label: `Chapters (${chapters.length})` },
    { id: 'comments', label: 'Comments' }
  ]

  if (isLoading || !title) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-in bg-[var(--color-bg-primary)]">
        <Loader2 className="animate-spin text-[var(--color-accent)] mb-4" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen fade-in">
      {/* Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 glass-strong safe-top">
        <div className="flex items-center justify-between px-3 py-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors">
            <ArrowLeft size={20} className="text-[var(--color-text-primary)]" />
          </button>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors">
              <Share2 size={18} className="text-[var(--color-text-secondary)]" />
            </button>
            <button className="p-2 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors">
              <MoreVertical size={18} className="text-[var(--color-text-secondary)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative pt-16">
        {/* Blurred background */}
        <div className="absolute inset-0 h-[300px] overflow-hidden">
          <img src={title.cover} alt="" className="w-full h-full object-cover blur-2xl scale-125 opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg-primary)]/30 via-transparent to-[var(--color-bg-primary)]" />
        </div>

        <div className="relative px-4 pt-6 pb-4 flex gap-4">
          {/* Cover */}
          <div className="flex-shrink-0 w-[120px] rounded-xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
            <img src={api.getProxyUrl(title.cover)} alt={title.title} className="w-full aspect-[3/4] object-cover bg-[var(--color-bg-card)]" />
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0 pt-2">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] leading-tight mb-1">{title.title}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">{title.author}</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {title.status && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${title.status === 'Ongoing' ? 'bg-green-500/20 text-green-400' : title.status === 'Completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {title.status}
                </span>
              )}
              {title.sourceName && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent-light)]">
                  {title.sourceName}
                </span>
              )}
            </div>
            {title.rating && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{title.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={toggleBookmark}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${isBookmarked ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]'}`}>
          {isBookmarked ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
          {isBookmarked ? 'In Library' : 'Add to Library'}
        </button>
        <button onClick={() => { if (chapters.length > 0) navigate(`/reader/${encodeURIComponent(decodedId)}/${encodeURIComponent(chapters[chapters.length-1]?.link || chapters[chapters.length-1]?.id)}?source=${title.sourceId}`) }}
          disabled={chapters.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] text-white hover:opacity-90 transition-opacity disabled:opacity-50">
          <Play size={16} fill="currentColor" />
          Start Reading
        </button>
        <button className="p-2.5 rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card-hover)] transition-colors">
          <Download size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4 flex gap-1 border-b border-[var(--color-divider)]">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-[var(--color-accent-light)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}>
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)] rounded-full" />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-8">
        {activeTab === 'overview' && (
          <div className="fade-in">
            {/* Genres */}
            {title.genres && title.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {title.genres.map(g => <GenrePill key={g} genre={g} onClick={() => navigate(`/search?genre=${g}`)} />)}
              </div>
            )}

            {/* Synopsis */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Synopsis</h3>
              <p className={`text-sm text-[var(--color-text-secondary)] leading-relaxed ${expandSynopsis ? '' : 'line-clamp-3'}`}>
                {title.description}
              </p>
              <button onClick={() => setExpandSynopsis(!expandSynopsis)}
                className="text-xs text-[var(--color-accent-light)] mt-1 flex items-center gap-0.5">
                {expandSynopsis ? <>Show Less <ChevronUp size={14} /></> : <>Read More <ChevronDown size={14} /></>}
              </button>
            </div>

            {/* Related Titles */}
            {relatedTitles.length > 0 && (
              <div>
                <SectionHeader title="Related Titles" />
                <HorizontalScroll>
                  {relatedTitles.map(t => <TitleCard key={t.id} title={t} subtitle={`★ ${t.rating}`} />)}
                </HorizontalScroll>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chapters' && (
          <div className="fade-in">
            {/* Chapter controls */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={e => setChapterSearch(e.target.value)}
                  placeholder="Search chapters..."
                  className="w-full bg-[var(--color-bg-input)] text-[var(--color-text-primary)] text-xs rounded-lg py-2 pl-8 pr-3 outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40"
                />
              </div>
              <button onClick={() => setChapterSort(s => s === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--color-bg-card)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] transition-colors">
                {chapterSort === 'newest' ? 'Newest' : 'Oldest'}
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Chapter List */}
            <div className="space-y-1">
              {filteredChapters.length === 0 && <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">No chapters found.</p>}
              {filteredChapters.map(ch => (
                <div key={ch.id || ch.link}
                  onClick={() => navigate(`/reader/${encodeURIComponent(decodedId)}/${encodeURIComponent(ch.link || ch.id)}?source=${title.sourceId}`)}
                  className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors ${ch.read ? 'bg-transparent hover:bg-[var(--color-bg-card)]/50' : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)]'}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${ch.read ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
                      {ch.number ? `Chapter ${ch.number}` : ch.title} {ch.number && ch.title && `- ${ch.title}`}
                    </p>
                    {ch.releaseDate && (
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {new Date(ch.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  {ch.read && (
                    <span className="text-[10px] text-[var(--color-accent-light)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded">Read</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="fade-in">
            <EmptyState
              title="Comments Coming Soon"
              description="Community comments will be available in a future update."
            />
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
    </div>
  )
}
