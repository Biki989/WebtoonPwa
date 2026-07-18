import { NavLink } from 'react-router-dom'
import { Home, Search, BookMarked, Clock, Settings } from 'lucide-react'

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/library', icon: BookMarked, label: 'Library' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 min-w-[56px] ${
                isActive
                  ? 'text-[var(--color-accent-light)] scale-105'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  {isActive && (
                    <div className="absolute -inset-2 bg-[var(--color-accent)] opacity-15 rounded-full blur-md" />
                  )}
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} className="relative" />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
