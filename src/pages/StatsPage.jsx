import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Book, Trophy, Flame } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[var(--color-bg-card)] rounded-xl p-4 flex flex-col items-center text-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2`} style={{ backgroundColor: `${color}20` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value.toLocaleString()}</p>
      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{label}</p>
    </div>
  )
}

function Heatmap({ data }) {
  const weeks = 26
  const days = 7
  const cells = []
  const now = new Date()

  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = 0; d < days; d++) {
      const date = new Date(now)
      date.setDate(date.getDate() - (w * 7 + (6 - d)))
      const key = date.toISOString().split('T')[0]
      const count = data[key] || 0
      const opacity = count === 0 ? 0.08 : Math.min(count / 12, 1) * 0.8 + 0.2
      cells.push(
        <div key={key} className="w-[11px] h-[11px] rounded-[2px]" title={`${key}: ${count} chapters`}
          style={{ backgroundColor: `rgba(139, 92, 246, ${opacity})` }} />
      )
    }
  }

  return (
    <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Reading Heatmap</h3>
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)`, gridTemplateRows: `repeat(${days}, 1fr)` }}>
        {cells}
      </div>
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-[10px] text-[var(--color-text-muted)]">Less</span>
        {[0.08, 0.3, 0.5, 0.7, 1].map((o, i) => (
          <div key={i} className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: `rgba(139, 92, 246, ${o})` }} />
        ))}
        <span className="text-[10px] text-[var(--color-text-muted)]">More</span>
      </div>
    </div>
  )
}

function GenreChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const colors = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6', '#6b7280']
  let cumulativeAngle = 0

  return (
    <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Genre Breakdown</h3>
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {data.map((d, i) => {
              const pct = d.count / total
              const angle = pct * 360
              const startAngle = cumulativeAngle
              cumulativeAngle += angle
              const r = 40; const cx = 50; const cy = 50
              const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180)
              const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180)
              const x2 = cx + r * Math.cos(((startAngle + angle) * Math.PI) / 180)
              const y2 = cy + r * Math.sin(((startAngle + angle) * Math.PI) / 180)
              const largeArc = angle > 180 ? 1 : 0
              return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={colors[i]} opacity={0.85} />
            })}
          </svg>
        </div>
        <div className="flex-1 space-y-1.5">
          {data.map((d, i) => (
            <div key={d.genre} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i] }} />
              <span className="text-[11px] text-[var(--color-text-secondary)] flex-1">{d.genre}</span>
              <span className="text-[11px] text-[var(--color-text-muted)]">{Math.round(d.count/total*100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DailyActivity({ data }) {
  const max = Math.max(...data.map(d => d.chapters), 1)
  return (
    <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Daily Activity (30 days)</h3>
      <div className="flex items-end gap-[3px] h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
            <div className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
              style={{ height: `${Math.max((d.chapters / max) * 100, 4)}%`, backgroundColor: d.chapters > 0 ? 'var(--color-accent)' : 'var(--color-bg-elevated)' }} />
            <div className="absolute -top-6 bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{d.chapters} ch</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopTitles({ data }) {
  const max = Math.max(...data.map(d => d.chapters))
  return (
    <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Top Titles</h3>
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={d.title}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--color-text-secondary)]"><span className="text-[var(--color-text-muted)] mr-1.5">#{i+1}</span>{d.title}</span>
              <span className="text-[11px] text-[var(--color-accent-light)] font-medium">{d.chapters} ch</span>
            </div>
            <div className="h-1.5 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)] rounded-full" style={{ width: `${(d.chapters/max)*100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StatsPage() {
  const navigate = useNavigate()

  const history = useLiveQuery(() => db.history.toArray()) || []
  const progress = useLiveQuery(() => db.progress.toArray()) || []
  const bookmarks = useLiveQuery(() => db.bookmarks.toArray()) || []

  // Compute stats
  const totalChaptersRead = new Set(progress.filter(p => p.completed).map(p => p.chapterId)).size
  const totalTitlesStarted = new Set(progress.map(p => p.titleId)).size
  const totalTitlesCompleted = bookmarks.filter(b => b.shelf === 'completed').length

  // Compute heatmap
  const heatmap = {}
  history.forEach(h => {
    const d = new Date(h.readAt).toISOString().split('T')[0]
    heatmap[d] = (heatmap[d] || 0) + 1
  })

  // Basic daily activity (last 30 days)
  const dailyActivity = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dailyActivity.push({ date: key, chapters: heatmap[key] || 0 })
  }

  // Top titles
  const titleCounts = {}
  history.forEach(h => {
    titleCounts[h.titleName] = (titleCounts[h.titleName] || 0) + 1
  })
  const topTitles = Object.entries(titleCounts)
    .map(([title, chapters]) => ({ title, chapters }))
    .sort((a, b) => b.chapters - a.chapters)
    .slice(0, 5)

  // Empty genre for now as it's not stored in DB simply
  const genreBreakdown = []

  return (
    <div className="min-h-screen fade-in pb-24">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 safe-top">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[var(--color-bg-card)]"><ArrowLeft size={20} className="text-[var(--color-text-primary)]" /></button>
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Reading Stats</h1>
      </div>
      <div className="px-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={BookOpen} label="Chapters Read" value={totalChaptersRead} color="#8b5cf6" />
          <StatCard icon={Book} label="Titles Started" value={totalTitlesStarted} color="#06b6d4" />
          <StatCard icon={Trophy} label="Completed" value={totalTitlesCompleted} color="#22c55e" />
        </div>
        <Heatmap data={heatmap} />
        {genreBreakdown.length > 0 && <GenreChart data={genreBreakdown} />}
        <DailyActivity data={dailyActivity} />
        {topTitles.length > 0 && <TopTitles data={topTitles} />}
      </div>
    </div>
  )
}
