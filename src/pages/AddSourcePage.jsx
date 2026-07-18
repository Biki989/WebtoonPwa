import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe, Code, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { db } from '../db'

const SELECTOR_TABS = [
  { id: 'search', label: 'Search', fields: [
    { key: 'urlTemplate', label: 'Search URL Template', placeholder: '/search?q={query}' },
    { key: 'itemContainer', label: 'Item Container', placeholder: '.search-results .item' },
    { key: 'titleText', label: 'Title Text', placeholder: '.item .title' },
    { key: 'titleLink', label: 'Title Link', placeholder: '.item a' },
    { key: 'coverImage', label: 'Cover Image', placeholder: '.item img' },
    { key: 'rating', label: 'Rating', placeholder: '.item .rating' },
  ]},
  { id: 'title', label: 'Title', fields: [
    { key: 'titleName', label: 'Title Name', placeholder: 'h1.title' },
    { key: 'coverImage', label: 'Cover Image', placeholder: '.cover img' },
    { key: 'description', label: 'Description', placeholder: '.synopsis p' },
    { key: 'genreTags', label: 'Genre Tags', placeholder: '.genres .tag' },
    { key: 'status', label: 'Status', placeholder: '.status-badge' },
    { key: 'author', label: 'Author', placeholder: '.author' },
  ]},
  { id: 'chapters', label: 'Chapters', fields: [
    { key: 'chapterItem', label: 'Chapter Item', placeholder: '.chapter-list .chapter' },
    { key: 'chapterNumber', label: 'Chapter Number', placeholder: '.chapter .num' },
    { key: 'chapterTitle', label: 'Chapter Title (optional)', placeholder: '.chapter .title' },
    { key: 'chapterLink', label: 'Chapter Link', placeholder: '.chapter a' },
    { key: 'releaseDate', label: 'Release Date', placeholder: '.chapter .date' },
  ]},
  { id: 'reader', label: 'Reader', fields: [
    { key: 'imageElement', label: 'Image Element', placeholder: '.reader-container img' },
    { key: 'imageAttr', label: 'Image Attribute', placeholder: 'src or data-src' },
  ]},
]

export default function AddSourcePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [basicInfo, setBasicInfo] = useState({ name: '', baseUrl: '', renderType: 'static' })
  const [selectors, setSelectors] = useState({})
  const [activeTab, setActiveTab] = useState('search')
  const [testResults, setTestResults] = useState(null)
  const [testing, setTesting] = useState(false)

  const updateSelector = (tab, key, value) => {
    setSelectors(prev => ({ ...prev, [`${tab}.${key}`]: value }))
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResults(null)
    try {
      // Build source object
      const sourceData = {
        name: basicInfo.name,
        baseUrl: basicInfo.baseUrl,
        renderType: basicInfo.renderType,
        selectors: {
          search: {
            urlTemplate: selectors['search.urlTemplate'],
            itemContainer: selectors['search.itemContainer'],
            titleText: selectors['search.titleText'],
            titleLink: selectors['search.titleLink'],
            coverImage: selectors['search.coverImage'],
            rating: selectors['search.rating']
          },
          title: {
            titleName: selectors['title.titleName'],
            coverImage: selectors['title.coverImage'],
            description: selectors['title.description'],
            genreTags: selectors['title.genreTags'],
            status: selectors['title.status'],
            author: selectors['title.author']
          },
          chapters: {
            chapterItem: selectors['chapters.chapterItem'],
            chapterNumber: selectors['chapters.chapterNumber'],
            chapterTitle: selectors['chapters.chapterTitle'],
            chapterLink: selectors['chapters.chapterLink'],
            releaseDate: selectors['chapters.releaseDate']
          },
          reader: {
            imageElement: selectors['reader.imageElement'],
            imageAttr: selectors['reader.imageAttr']
          }
        }
      }
      const results = await api.testSource(sourceData)
      setTestResults(results)
    } catch (e) {
      alert("Test failed: " + e.message)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    try {
      const sourceId = 'src-' + Date.now()
      const sourceData = {
        id: sourceId,
        name: basicInfo.name,
        baseUrl: basicInfo.baseUrl,
        renderType: basicInfo.renderType,
        enabled: true,
        selectors: {
          search: {
            urlTemplate: selectors['search.urlTemplate'],
            itemContainer: selectors['search.itemContainer'],
            titleText: selectors['search.titleText'],
            titleLink: selectors['search.titleLink'],
            coverImage: selectors['search.coverImage'],
            rating: selectors['search.rating']
          },
          title: {
            titleName: selectors['title.titleName'],
            coverImage: selectors['title.coverImage'],
            description: selectors['title.description'],
            genreTags: selectors['title.genreTags'],
            status: selectors['title.status'],
            author: selectors['title.author']
          },
          chapters: {
            chapterItem: selectors['chapters.chapterItem'],
            chapterNumber: selectors['chapters.chapterNumber'],
            chapterTitle: selectors['chapters.chapterTitle'],
            chapterLink: selectors['chapters.chapterLink'],
            releaseDate: selectors['chapters.releaseDate']
          },
          reader: {
            imageElement: selectors['reader.imageElement'],
          }
        }
      }
      
      // Save locally to Dexie
      await db.sourcesLocal.put({ ...sourceData, sourceId })
      
      // Save to backend so scraper can use it
      await api.createSource({
        name: sourceData.name,
        baseUrl: sourceData.baseUrl,
        renderType: sourceData.renderType,
        selectors: sourceData.selectors
      })
      
      navigate('/settings')
    } catch (e) {
      alert("Failed to save: " + e.message)
    }
  }

  return (
    <div className="min-h-screen fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 safe-top">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-[var(--color-bg-card)]">
          <ArrowLeft size={20} className="text-[var(--color-text-primary)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Add Source</h1>
      </div>

      {/* Step Indicator */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${s <= step ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'}`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && <div className={`h-0.5 flex-1 rounded ${s < step ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bg-elevated)]'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[var(--color-text-muted)]">Basic Info</span>
          <span className="text-[10px] text-[var(--color-text-muted)]">Selectors</span>
          <span className="text-[10px] text-[var(--color-text-muted)]">Test & Save</span>
        </div>
      </div>

      <div className="px-4 pb-8">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4 fade-in">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Source Name</label>
              <input value={basicInfo.name} onChange={e => setBasicInfo({...basicInfo, name: e.target.value})}
                placeholder="e.g. MangaDex" className="w-full bg-[var(--color-bg-input)] text-[var(--color-text-primary)] text-sm rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Base URL</label>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />
                <input value={basicInfo.baseUrl} onChange={e => setBasicInfo({...basicInfo, baseUrl: e.target.value})}
                  placeholder="https://mangadex.org" className="flex-1 bg-[var(--color-bg-input)] text-[var(--color-text-primary)] text-sm rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Render Type</label>
              <div className="flex gap-2">
                {[{id:'static',label:'Static HTML',desc:'Cheerio'},{id:'js',label:'JS-Rendered',desc:'Puppeteer'}].map(rt => (
                  <button key={rt.id} onClick={() => setBasicInfo({...basicInfo, renderType: rt.id})}
                    className={`flex-1 p-3 rounded-xl text-left transition-all ${basicInfo.renderType===rt.id ? 'bg-[var(--color-accent)]/20 ring-1 ring-[var(--color-accent)]' : 'bg-[var(--color-bg-card)]'}`}>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{rt.label}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{rt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!basicInfo.name || !basicInfo.baseUrl}
              className="w-full py-3 rounded-xl bg-[var(--color-accent)] text-white font-medium disabled:opacity-40 hover:opacity-90 transition-opacity mt-4">
              Next: Configure Selectors
            </button>
          </div>
        )}

        {/* Step 2: Selectors */}
        {step === 2 && (
          <div className="fade-in">
            <div className="flex gap-1 mb-4 overflow-x-auto hide-scrollbar">
              {SELECTOR_TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab===tab.id ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]'}`}>
                  <Code size={12} className="inline mr-1" />{tab.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {SELECTOR_TABS.find(t => t.id === activeTab)?.fields.map(f => (
                <div key={f.key}>
                  <label className="text-xs text-[var(--color-text-muted)] mb-1 block">{f.label}</label>
                  <input value={selectors[`${activeTab}.${f.key}`] || ''} onChange={e => updateSelector(activeTab, f.key, e.target.value)}
                    placeholder={f.placeholder} className="w-full bg-[var(--color-bg-input)] text-[var(--color-text-primary)] text-xs font-mono rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] font-medium">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-[var(--color-accent)] text-white font-medium">Next: Test</button>
            </div>
          </div>
        )}

        {/* Step 3: Test & Save */}
        {step === 3 && (
          <div className="fade-in">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Test Your Source</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Run a full test across all selector groups</p>
            </div>
            {!testResults && (
              <button onClick={handleTest} disabled={testing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60">
                {testing ? <><Loader2 size={18} className="animate-spin" /> Testing...</> : 'Run Full Test'}
              </button>
            )}
            {testResults && (
              <div className="space-y-2 mb-6">
                {Object.entries(testResults).map(([key, val]) => (
                  <div key={key} className={`flex items-center gap-3 p-3 rounded-xl ${val.status==='success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {val.status==='success' ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-red-400" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] capitalize">{key}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">{val.status==='success' ? `${val.found} items found` : val.error}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setStep(2); setTestResults(null) }} className="flex-1 py-3 rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] font-medium">Back</button>
              <button onClick={handleSave} disabled={!testResults} className="flex-1 py-3 rounded-xl bg-[var(--color-accent)] text-white font-medium disabled:opacity-40">Save Source</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
