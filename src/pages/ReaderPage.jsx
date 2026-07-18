import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, ChevronLeft, ChevronRight, Star, Loader2 } from 'lucide-react'
import { useReaderStore } from '../stores'
import api from '../utils/api'
import { db } from '../db'

export default function ReaderPage() {
  const { titleId, chapterId } = useParams()
  const decodedTitleId = decodeURIComponent(titleId)
  const decodedChapterId = decodeURIComponent(chapterId)
  const navigate = useNavigate()
  
  // Get sourceId from query params
  const sourceId = new URLSearchParams(window.location.search).get('source')
  
  const { readingMode, setReadingMode, backgroundColor, setBackgroundColor, showUI, toggleUI, setShowUI } = useReaderStore()
  
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [loadedImages, setLoadedImages] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showEndScreen, setShowEndScreen] = useState(false)
  const [rating, setRating] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollContainerRef = useRef(null)
  const lastScrollY = useRef(0)

  const [titleDetails, setTitleDetails] = useState(null)
  const [chaptersDetails, setChaptersDetails] = useState([])

  const currentChIdx = chaptersDetails.findIndex(c => c.link === decodedChapterId || c.id === decodedChapterId)
  const currentChapter = currentChIdx >= 0 ? chaptersDetails[currentChIdx] : { number: '?', id: decodedChapterId }
  const prevChapter = currentChIdx < chaptersDetails.length - 1 ? chaptersDetails[currentChIdx + 1] : null // Usually index 0 is newest. If 0 is newest, +1 is older chapter contextually. Wait, reader logic usually preps next/prev.
  const nextChapter = currentChIdx > 0 ? chaptersDetails[currentChIdx - 1] : null // -1 is newer (next)

  useEffect(() => {
    let active = true
    async function loadReader() {
      setIsLoading(true)
      setError(null)
      try {
        if (!sourceId) throw new Error("Missing source ID")
        
        // Fetch title & chapters side-channel if missing
        api.getTitle(sourceId, decodedTitleId).then(t => active && setTitleDetails(t)).catch(console.error)
        api.getChapters(sourceId, decodedTitleId).then(chs => active && setChaptersDetails(chs)).catch(console.error)

        const readerData = await api.getReader(sourceId, decodedChapterId)
        if (active) {
          setImages(readerData.images || [])
          setCurrentPage(0)
          setShowEndScreen(false)
          setShowUI(true)
          window.scrollTo(0, 0)
        }
      } catch (err) {
        console.error(err)
        if (active) setError(err.message)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadReader()
    return () => { active = false }
  }, [decodedChapterId, decodedTitleId, sourceId])

  // Save history and progress
  useEffect(() => {
    if (!titleDetails || images.length === 0) return
    const saveProgress = async () => {
      try {
        await db.history.put({
          titleId: decodedTitleId,
          sourceId,
          titleName: titleDetails.title,
          cover: titleDetails.cover,
          chapterId: decodedChapterId,
          chapterName: currentChapter.number ? `Chapter ${currentChapter.number}` : currentChapter.title,
          readAt: new Date().toISOString()
        })
        await db.progress.put({
          titleId: decodedTitleId,
          chapterId: decodedChapterId,
          page: currentPage,
          totalPages: images.length,
          completed: showEndScreen || (currentPage >= images.length - 1),
          updatedAt: new Date().toISOString()
        })
      } catch (e) {
        console.error("Failed to save progress", e)
      }
    }
    saveProgress()
  }, [currentPage, showEndScreen, titleDetails, images.length, decodedChapterId])
  useEffect(() => {
    if (readingMode !== 'vertical') return
    
    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0
      setScrollProgress(progress)
      setCurrentPage(Math.floor((progress / 100) * images.length))

      // Auto-hide UI on scroll down
      if (Math.abs(scrollY - lastScrollY.current) > 50) {
        if (scrollY > lastScrollY.current && scrollY > 100) setShowUI(false)
        lastScrollY.current = scrollY
      }

      // Show end screen at 95%
      if (progress > 95) setShowEndScreen(true)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [readingMode, images.length])

  const handleImageLoad = (idx) => {
    setLoadedImages(prev => new Set([...prev, idx]))
  }

  const bgColors = [
    { name: 'Black', value: '#000000' },
    { name: 'Dark', value: '#1a1a2e' },
    { name: 'Sepia', value: '#3d2b1f' },
    { name: 'White', value: '#f5f5f5' },
  ]

  // Horizontal mode handlers
  const goToPage = (page) => {
    if (page >= 0 && page < images.length) setCurrentPage(page)
    else if (page >= images.length) setShowEndScreen(true)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }} onClick={toggleUI}>
      {/* Top Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${showUI ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="glass-strong safe-top">
          <div className="flex items-center justify-between px-3 py-3">
            <button onClick={(e) => { e.stopPropagation(); navigate(-1) }} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className="text-center flex-1 min-w-0 px-2">
              <p className="text-sm font-medium text-white line-clamp-1">{titleDetails?.title || 'Loading...'}</p>
              <p className="text-[11px] text-white/60">{currentChapter?.number ? `Chapter ${currentChapter.number}` : currentChapter?.title || ''}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings) }} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Settings size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Reading Area */}
      {isLoading ? (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="animate-spin text-[var(--color-accent)]" size={40} />
        </div>
      ) : error ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-white mb-4">Error loading chapter: {error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg">Go Back</button>
        </div>
      ) : readingMode === 'vertical' ? (
        <div ref={scrollContainerRef} className="pt-2" onClick={toggleUI}>
          {images.map((src, i) => (
            <div key={i} className="relative w-full">
              {!loadedImages.has(i) && (
                <div className="w-full aspect-[2/3] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <img
                src={api.getProxyUrl(src)}
                alt={`Page ${i + 1}`}
                loading={i < 3 ? 'eager' : 'lazy'}
                onLoad={() => handleImageLoad(i)}
                className={`w-full block ${loadedImages.has(i) ? '' : 'h-0 overflow-hidden'}`}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor }}>
          {images[currentPage] && (
            <img src={api.getProxyUrl(images[currentPage])} alt={`Page ${currentPage + 1}`} className="max-w-full max-h-full object-contain" />
          )}
          {/* Touch areas for page navigation */}
          <div className="absolute inset-y-0 left-0 w-1/3 cursor-pointer" onClick={(e) => { e.stopPropagation(); goToPage(currentPage - 1) }} />
          <div className="absolute inset-y-0 right-0 w-1/3 cursor-pointer" onClick={(e) => { e.stopPropagation(); goToPage(currentPage + 1) }} />
        </div>
      )}

      {/* Bottom Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${showUI ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="glass-strong safe-bottom">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={(e) => { e.stopPropagation(); if (prevChapter) navigate(`/reader/${encodeURIComponent(decodedTitleId)}/${encodeURIComponent(prevChapter.link || prevChapter.id)}?source=${sourceId}`, { replace: true }) }}
              disabled={!prevChapter}
              className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30">
              <ChevronLeft size={20} className="text-white" />
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={Math.max(0, images.length - 1)}
                value={currentPage}
                onChange={(e) => {
                  e.stopPropagation()
                  const page = parseInt(e.target.value)
                  setCurrentPage(page)
                  if (readingMode === 'vertical') {
                    const scrollTarget = (page / images.length) * (document.documentElement.scrollHeight - window.innerHeight)
                    window.scrollTo({ top: scrollTarget, behavior: 'smooth' })
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full accent-[var(--color-accent)]"
              />
              <p className="text-center text-[11px] text-white/60 mt-0.5">
                Page {images.length > 0 ? currentPage + 1 : 0} / {images.length}
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); if (nextChapter) navigate(`/reader/${encodeURIComponent(decodedTitleId)}/${encodeURIComponent(nextChapter.link || nextChapter.id)}?source=${sourceId}`, { replace: true }) }}
              disabled={!nextChapter}
              className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30">
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Reader Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setShowSettings(false) }}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute bottom-0 left-0 right-0 slide-up" onClick={e => e.stopPropagation()}>
            <div className="glass-strong rounded-t-2xl px-5 py-6 safe-bottom">
              <h3 className="text-lg font-bold text-white mb-4">Reader Settings</h3>
              
              {/* Reading Mode */}
              <div className="mb-4">
                <p className="text-xs text-white/60 mb-2">Reading Direction</p>
                <div className="flex gap-2">
                  {['vertical', 'horizontal'].map(mode => (
                    <button key={mode} onClick={() => setReadingMode(mode)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${readingMode === mode ? 'bg-[var(--color-accent)] text-white' : 'bg-white/10 text-white/70'}`}>
                      {mode === 'vertical' ? 'Vertical Scroll' : 'Horizontal Swipe'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div className="mb-4">
                <p className="text-xs text-white/60 mb-2">Background Color</p>
                <div className="flex gap-2">
                  {bgColors.map(bg => (
                    <button key={bg.value} onClick={() => setBackgroundColor(bg.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${backgroundColor === bg.value ? 'ring-2 ring-[var(--color-accent)]' : ''}`}
                      style={{ backgroundColor: bg.value, color: bg.value === '#f5f5f5' ? '#333' : '#fff' }}>
                      {bg.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter End Screen */}
      {showEndScreen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 w-[90%] max-w-sm text-center slide-up">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">{currentChapter?.number ? `Chapter ${currentChapter.number}` : currentChapter?.title} Complete!</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Rate this chapter</p>
            
            {/* Star Rating */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => {
                  setRating(star)
                  db.ratings.put({ titleId: decodedTitleId, chapterId: decodedChapterId, rating: star, updatedAt: new Date().toISOString() })
                }}>
                  <Star size={28} className={`transition-colors ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--color-text-muted)]'}`} />
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {nextChapter && (
                <button onClick={() => { setShowEndScreen(false); navigate(`/reader/${encodeURIComponent(decodedTitleId)}/${encodeURIComponent(nextChapter.link || nextChapter.id)}?source=${sourceId}`, { replace: true }) }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] text-white font-medium hover:opacity-90 transition-opacity">
                  Next Chapter →
                </button>
              )}
              <button onClick={() => { setShowEndScreen(false); navigate(`/title/${encodeURIComponent(decodedTitleId)}`) }}
                className="w-full py-3 rounded-xl bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] font-medium hover:bg-[var(--color-bg-card-hover)] transition-colors">
                Back to Title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
