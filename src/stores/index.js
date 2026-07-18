import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set, get) => ({
      theme: 'Dark',
      accentColor: '#8b5cf6',
      backendUrl: 'http://localhost:3001',
      connectionStatus: 'unknown', // 'connected', 'disconnected', 'unknown'
      bottomNavStyle: 'default',
      
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setBackendUrl: (backendUrl) => set({ backendUrl }),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
      
      testConnection: async () => {
        const url = get().backendUrl
        try {
          const res = await fetch(`${url}/api/health`)
          if (res.ok) {
            set({ connectionStatus: 'connected' })
            return true
          }
          set({ connectionStatus: 'disconnected' })
          return false
        } catch {
          set({ connectionStatus: 'disconnected' })
          return false
        }
      }
    }),
    {
      name: 'webtoonpwa-app-store',
      partialize: (state) => ({ 
        theme: state.theme, 
        accentColor: state.accentColor, 
        backendUrl: state.backendUrl,
        bottomNavStyle: state.bottomNavStyle 
      })
    }
  )
)

export const useSearchStore = create((set) => ({
  query: '',
  results: [],
  suggestions: [],
  filters: { source: 'all', status: 'all', sort: 'relevance' },
  isLoading: false,
  recentSearches: [],

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  setIsLoading: (isLoading) => set({ isLoading }),
  addRecentSearch: (term) => set((s) => ({
    recentSearches: [term, ...s.recentSearches.filter(t => t !== term)].slice(0, 10)
  })),
  removeRecentSearch: (term) => set((s) => ({
    recentSearches: s.recentSearches.filter(t => t !== term)
  })),
  clearRecentSearches: () => set({ recentSearches: [] })
}))

export const useReaderStore = create((set) => ({
  currentTitle: null,
  currentChapter: null,
  chapters: [],
  readingMode: 'vertical', // 'vertical' or 'horizontal'
  backgroundColor: '#000000',
  brightness: 100,
  imageFit: 'width', // 'width', 'height', 'original'
  zoomLocked: false,
  showUI: true,
  autoAdvance: true,

  setCurrentTitle: (t) => set({ currentTitle: t }),
  setCurrentChapter: (c) => set({ currentChapter: c }),
  setChapters: (chapters) => set({ chapters }),
  setReadingMode: (m) => set({ readingMode: m }),
  setBackgroundColor: (c) => set({ backgroundColor: c }),
  setBrightness: (b) => set({ brightness: b }),
  setImageFit: (f) => set({ imageFit: f }),
  toggleUI: () => set((s) => ({ showUI: !s.showUI })),
  setShowUI: (v) => set({ showUI: v })
}))

export const useLibraryStore = create((set) => ({
  activeShelf: 'all',
  viewMode: 'grid', // 'grid' or 'list'
  sortBy: 'lastRead', // 'lastRead', 'lastUpdated', 'titleAZ', 'dateAdded'
  
  setActiveShelf: (shelf) => set({ activeShelf: shelf }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sort) => set({ sortBy: sort })
}))
