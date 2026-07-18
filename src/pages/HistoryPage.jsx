import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Trash2, BookOpen } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { EmptyState } from '../components/ui'

function groupByDate(items) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today - 86400000)
  const weekAgo = new Date(today - 7 * 86400000)

  const groups = { 'Today': [], 'Yesterday': [], 'This Week': [], 'Earlier': [] }

  items.forEach(item => {
    const d = new Date(item.readAt)
    if (d >= today) groups['Today'].push(item)
    else if (d >= yesterday) groups['Yesterday'].push(item)
    else if (d >= weekAgo) groups['This Week'].push(item)
    else groups['Earlier'].push(item)
  })

  return Object.entries(groups).filter(([, items]) => items.length > 0)
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const history = useLiveQuery(() => db.history.orderBy('readAt').reverse().toArray()) || []
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const grouped = groupByDate(history)

  return (
    <div className="min-h-screen fade-in">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 safe-top flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Reading History</h1>
        {history.length > 0 && (
          <button onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors">
            <Trash2 size={14} />
            Clear All
          </button>
        )}
      </div>

      {/* History List */}
      <div className="px-4 pb-8">
        {history.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No reading history yet"
            description="Start reading to see your history here"
            action="Start Reading"
            onAction={() => navigate('/')}
          />
        ) : (
          <div className="space-y-6">
            {grouped.map(([label, items]) => (
              <div key={label}>
                <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">{label}</h2>
                <div className="space-y-1.5">
                  {items.map(item => (
                    <div key={item.id}
                      onClick={() => navigate(`/title/${item.titleId}`)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] transition-colors cursor-pointer group">
                      <img src={item.coverImage} alt="" className="w-11 h-15 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-1">{item.titleName}</h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                          <BookOpen size={12} />
                          Read Chapter {item.chapterNum}
                        </p>
                      </div>
                      <span className="text-[11px] text-[var(--color-text-muted)] flex-shrink-0">
                        {formatTime(item.readAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowClearConfirm(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-[var(--color-bg-card)] rounded-2xl p-6 w-[85%] max-w-sm slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Clear All History?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-5">This action cannot be undone. All your reading history will be permanently deleted.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] font-medium text-sm hover:bg-[var(--color-bg-card-hover)] transition-colors">
                Cancel
              </button>
              <button onClick={async () => { await db.history.clear(); setShowClearConfirm(false) }}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-error)] text-white font-medium text-sm hover:opacity-90 transition-opacity">
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
