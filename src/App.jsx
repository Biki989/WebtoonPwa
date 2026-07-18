import { Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import BottomNav from './components/BottomNav'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAppStore } from './stores'
import api from './utils/api'
import { db } from './db'

const HomePage = lazy(() => import('./pages/HomePage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const TitleDetailPage = lazy(() => import('./pages/TitleDetailPage'))
const ReaderPage = lazy(() => import('./pages/ReaderPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const AddSourcePage = lazy(() => import('./pages/AddSourcePage'))

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--color-text-muted)]">Loading...</span>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/reader')
  
  const { theme, accentColor } = useAppStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'System' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light') : theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-accent', accentColor)
  }, [accentColor])

  // Sync sources from backend on app startup
  useEffect(() => {
    async function syncSources() {
      try {
        const sources = await api.getSources()
        if (sources && sources.length > 0) {
          const syncedSources = sources.map(s => ({ ...s, sourceId: s.id }))
          await db.sourcesLocal.bulkPut(syncedSources)
        }
      } catch (e) {
        console.error('Failed to sync sources', e)
      }
    }
    syncSources()
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-primary)]">
      <Suspense fallback={<LoadingScreen />}>
        <ErrorBoundary>
          <main className={`flex-1 ${hideNav ? '' : 'pb-20'}`}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/title/:id" element={<TitleDetailPage />} />
              <Route path="/reader/:titleId/:chapterId" element={<ReaderPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/add-source" element={<AddSourcePage />} />
            </Routes>
          </main>
        </ErrorBoundary>
      </Suspense>
      {!hideNav && <BottomNav />}
    </div>
  )
}
