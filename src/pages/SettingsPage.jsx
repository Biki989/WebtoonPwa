import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Palette, BookOpen, Database, Wifi, Info, ChevronRight, Plus, ToggleLeft, ToggleRight, Trash2, Edit2, BarChart3, Download, Upload, RotateCcw, CheckCircle, XCircle, Smartphone } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { SOURCES } from '../utils/mockData'
import { useAppStore } from '../stores'
import { exportAllData, importAllData, db } from '../db'

const ACCENT_COLORS = ['#8b5cf6','#3b82f6','#06b6d4','#22c55e','#ec4899','#f97316']

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 px-1">{title}</h2>
      <div className="bg-[var(--color-bg-card)] rounded-xl overflow-hidden divide-y divide-[var(--color-divider)]">{children}</div>
    </div>
  )
}

function Row({ icon: Icon, label, value, onClick, trailing, destructive }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3.5 ${onClick ? 'cursor-pointer hover:bg-[var(--color-bg-card-hover)]' : ''} transition-colors`}>
      {Icon && <Icon size={18} className={destructive ? 'text-[var(--color-error)]' : 'text-[var(--color-accent-light)]'} />}
      <span className={`flex-1 text-sm ${destructive ? 'text-[var(--color-error)]' : 'text-[var(--color-text-primary)]'}`}>{label}</span>
      {value && <span className="text-xs text-[var(--color-text-muted)]">{value}</span>}
      {trailing}
      {onClick && !trailing && <ChevronRight size={16} className="text-[var(--color-text-muted)]" />}
    </div>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { theme, setTheme, accentColor, setAccentColor, backendUrl, connectionStatus, setBackendUrl, testConnection, bottomNavStyle, setBottomNavStyle } = useAppStore()
  
  // Load real sources from Dexie, fallback to empty array
  const sources = useLiveQuery(() => db.sourcesLocal.toArray()) || []
  
  const [tempUrl, setTempUrl] = useState(backendUrl)
  const [testing, setTesting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef(null)

  const toggleSource = async (id) => {
    const source = sources.find(s => s.id === id)
    if (source) {
      await db.sourcesLocal.update(id, { enabled: !source.enabled })
    }
  }
  
  const handleTest = async () => { setTesting(true); setBackendUrl(tempUrl); await testConnection(); setTesting(false) }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const dataStr = await exportAllData()
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `webtoonpwa-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsImporting(true)
      const text = await file.text()
      await importAllData(text)
      alert('Import successful!')
    } catch (err) {
      alert('Import failed, invalid format')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      await db.transaction('rw', db.bookmarks, db.progress, db.history, db.ratings, db.settings, db.sourcesLocal, async () => {
        await db.bookmarks.clear()
        await db.progress.clear()
        await db.history.clear()
        await db.ratings.clear()
        await db.settings.clear()
        await db.sourcesLocal.clear()
      })
      alert('Data reset complete.')
    }
  }

  return (
    <div className="min-h-screen fade-in">
      <div className="px-4 pt-4 safe-top">
        <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-[var(--color-bg-card)]">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-secondary)] flex items-center justify-center"><User size={28} className="text-white" /></div>
          <div className="flex-1"><h2 className="text-lg font-bold text-[var(--color-text-primary)]">Reader</h2><p className="text-xs text-[var(--color-text-muted)]">42 titles · 1,247 chapters · 12 day streak</p></div>
          <button onClick={() => navigate('/stats')} className="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)]"><BarChart3 size={18} className="text-[var(--color-accent-light)]" /></button>
        </div>
      </div>
      <div className="px-4 pb-8">
        <Section title="Sources">
          {sources.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1"><p className="text-sm font-medium text-[var(--color-text-primary)]">{s.name}</p><p className="text-[11px] text-[var(--color-text-muted)]">{s.baseUrl}</p></div>
              <button className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)]"><Edit2 size={14} className="text-[var(--color-text-muted)]" /></button>
              <button onClick={() => toggleSource(s.id)}>{s.enabled ? <ToggleRight size={24} className="text-[var(--color-accent)]" /> : <ToggleLeft size={24} className="text-[var(--color-text-muted)]" />}</button>
            </div>
          ))}
          <Row icon={Plus} label="Add New Source" onClick={() => navigate('/add-source')} />
        </Section>
        <Section title="Appearance">
          <div className="px-4 py-3.5"><p className="text-sm text-[var(--color-text-primary)] mb-2">Theme</p><div className="flex gap-2">{['Dark','Light','Sepia','System'].map(t => <button key={t} onClick={() => setTheme(t)} className={`flex-1 py-2 rounded-lg text-xs font-medium ${t===theme?'bg-[var(--color-accent)] text-white':'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'}`}>{t}</button>)}</div></div>
          <div className="px-4 py-3.5"><p className="text-sm text-[var(--color-text-primary)] mb-2">Accent Color</p><div className="flex gap-3">{ACCENT_COLORS.map(c => <button key={c} onClick={() => setAccentColor(c)} className={`w-8 h-8 rounded-full ${accentColor===c?'ring-2 ring-offset-2 ring-offset-[var(--color-bg-card)] scale-110':''}`} style={{backgroundColor:c}} />)}</div></div>
        </Section>
        <Section title="Reader Defaults">
          <Row icon={BookOpen} label="Default Reading Mode" value="Vertical Scroll" onClick={()=>{}} />
          <Row icon={Palette} label="Default Background" value="Black" onClick={()=>{}} />
          <Row icon={Smartphone} label="Auto-Advance" trailing={<ToggleRight size={22} className="text-[var(--color-accent)] cursor-pointer" />} />
        </Section>
        <Section title="Storage & Cache">
          <Row icon={Database} label="Cache Size" value="24.3 MB" />
          <Row icon={Trash2} label="Clear Image Cache" onClick={()=>{}} />
          <Row icon={Trash2} label="Clear Chapter Cache" onClick={()=>{}} />
        </Section>
        <Section title="Data Management">
          <Row icon={Download} label={isExporting ? "Exporting..." : "Export Library & Progress"} onClick={handleExport} />
          <Row icon={Upload} label={isImporting ? "Importing..." : "Import from JSON"} onClick={() => fileInputRef.current?.click()} />
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
          <Row icon={RotateCcw} label="Reset All Data" onClick={handleReset} destructive />
        </Section>
        <Section title="Network">
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[var(--color-text-primary)]">Backend URL</p>
              <div className="flex items-center gap-1.5">
                {connectionStatus==='connected'?<CheckCircle size={14} className="text-[var(--color-success)]" />:connectionStatus==='disconnected'?<XCircle size={14} className="text-[var(--color-error)]" />:null}
                <span className="text-[11px] text-[var(--color-text-muted)]">{connectionStatus}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <input value={tempUrl} onChange={e=>setTempUrl(e.target.value)} className="flex-1 bg-[var(--color-bg-input)] text-[var(--color-text-primary)] text-xs rounded-lg py-2 px-3 outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40" />
              <button onClick={handleTest} disabled={testing} className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white text-xs font-medium">{testing?'...':'Test'}</button>
            </div>
          </div>
        </Section>
        <Section title="About"><Row icon={Info} label="Version" value="1.0.0" /><Row icon={Info} label="Build" value="March 2026" /></Section>
      </div>
    </div>
  )
}
