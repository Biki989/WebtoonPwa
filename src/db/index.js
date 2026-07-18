import Dexie from 'dexie'

export const db = new Dexie('WebtoonPWA')

db.version(1).stores({
  progress: '[titleId+chapterId], titleId, readAt',
  bookmarks: 'titleId, shelf, addedAt, sourceId',
  history: '++id, titleId, chapterId, readAt',
  chapterCache: 'chapterId, cachedAt',
  settings: 'key',
  ratings: 'chapterId, ratedAt',
  sourcesLocal: 'sourceId'
})

db.version(2).stores({
  progress: '[titleId+chapterId], titleId, readAt, updatedAt'
})

// Helper functions
export async function getSetting(key, defaultValue = null) {
  const row = await db.settings.get(key)
  return row ? row.value : defaultValue
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

export async function addToHistory(titleId, chapterId, chapterNum, titleName, coverImage) {
  await db.history.add({
    titleId,
    chapterId,
    chapterNum,
    titleName,
    coverImage,
    readAt: new Date().toISOString()
  })
}

export async function addBookmark(titleId, title, cover, shelf, sourceId) {
  await db.bookmarks.put({
    titleId,
    title,
    cover,
    shelf: shelf || 'reading',
    sourceId,
    addedAt: new Date().toISOString()
  })
}

export async function removeBookmark(titleId) {
  await db.bookmarks.delete(titleId)
}

export async function updateProgress(titleId, chapterId, page, scrollPct) {
  await db.progress.put({
    titleId,
    chapterId,
    page,
    scrollPct,
    readAt: new Date().toISOString(),
    completed: scrollPct >= 90
  })
}

export async function exportAllData() {
  const [bookmarks, progress, history, ratings, settings] = await Promise.all([
    db.bookmarks.toArray(),
    db.progress.toArray(),
    db.history.toArray(),
    db.ratings.toArray(),
    db.settings.toArray()
  ])
  return JSON.stringify({ bookmarks, progress, history, ratings, settings }, null, 2)
}

export async function importAllData(jsonString) {
  const data = JSON.parse(jsonString)
  await db.transaction('rw', db.bookmarks, db.progress, db.history, db.ratings, db.settings, async () => {
    if (data.bookmarks) { await db.bookmarks.clear(); await db.bookmarks.bulkAdd(data.bookmarks) }
    if (data.progress) { await db.progress.clear(); await db.progress.bulkAdd(data.progress) }
    if (data.history) { await db.history.clear(); await db.history.bulkAdd(data.history) }
    if (data.ratings) { await db.ratings.clear(); await db.ratings.bulkAdd(data.ratings) }
    if (data.settings) { await db.settings.clear(); await db.settings.bulkAdd(data.settings) }
  })
}
