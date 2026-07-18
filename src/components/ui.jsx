import { useNavigate } from 'react-router-dom'

export function TitleCard({ title, onClick, showSource = true, subtitle, badge }) {
  const navigate = useNavigate()
  
  const handleClick = () => {
    if (onClick) onClick()
    else navigate(`/title/${title.id}`)
  }

  return (
    <div
      onClick={handleClick}
      className="flex-shrink-0 w-[130px] cursor-pointer group"
    >
      <div className="relative rounded-xl overflow-hidden aspect-[3/4] mb-2 bg-[var(--color-bg-card)]">
        <img
          src={title.cover}
          alt={title.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {badge && (
          <div className="absolute top-2 right-2 bg-[var(--color-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            {badge}
          </div>
        )}
        
        {showSource && title.sourceName && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-[var(--color-text-primary)] text-[9px] font-medium px-1.5 py-0.5 rounded-md">
            {title.sourceName}
          </div>
        )}
      </div>
      
      <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] leading-tight line-clamp-2">
        {title.title}
      </h3>
      {subtitle && (
        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}

export function TitleCardWide({ title, onClick }) {
  const navigate = useNavigate()
  
  const handleClick = () => {
    if (onClick) onClick()
    else navigate(`/title/${title.id}`)
  }

  return (
    <div onClick={handleClick} className="flex gap-3 p-3 rounded-xl bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] transition-colors cursor-pointer">
      <img src={title.cover} alt={title.title} loading="lazy" className="w-14 h-20 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1">{title.title}</h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{title.author}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {title.sourceName && (
            <span className="text-[10px] bg-[var(--color-accent)]/20 text-[var(--color-accent-light)] px-1.5 py-0.5 rounded">{title.sourceName}</span>
          )}
          <span className="text-[10px] text-[var(--color-text-muted)]">★ {title.rating}</span>
        </div>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[130px]">
      <div className="skeleton aspect-[3/4] rounded-xl mb-2" />
      <div className="skeleton h-3 w-[90%] rounded mb-1" />
      <div className="skeleton h-3 w-[60%] rounded" />
    </div>
  )
}

export function HorizontalScroll({ children, className = '' }) {
  return (
    <div className={`flex gap-3 overflow-x-auto hide-scrollbar pb-1 ${className}`}>
      {children}
    </div>
  )
}

export function SectionHeader({ title, onSeeAll }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-xs font-medium text-[var(--color-accent-light)] hover:text-[var(--color-accent)] transition-colors">
          See All →
        </button>
      )}
    </div>
  )
}

export function GenrePill({ genre, onClick, active = false }) {
  return (
    <button
      onClick={() => onClick?.(genre)}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/30'
          : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {genre}
    </button>
  )
}

export function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center fade-in">
      {Icon && (
        <div className="w-20 h-20 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center mb-4">
          <Icon size={32} className="text-[var(--color-text-muted)]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-[280px]">{description}</p>
      {action && onAction && (
        <button onClick={onAction} className="mt-4 px-6 py-2.5 bg-[var(--color-accent)] text-white rounded-full font-medium text-sm hover:bg-[var(--color-accent-dark)] transition-colors">
          {action}
        </button>
      )}
    </div>
  )
}

export function ProgressBar({ value, max = 100, className = '' }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className={`h-1 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden ${className}`}>
      <div 
        className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)] rounded-full transition-all duration-500" 
        style={{ width: `${pct}%` }} 
      />
    </div>
  )
}
