// Mock data for the WebtoonPWA app — realistic sample content
// Cover images use picsum.photos for variety

const covers = (id) => `https://picsum.photos/seed/wt${id}/300/400`

export const GENRES = [
  'Action', 'Romance', 'Fantasy', 'Horror', 'Sci-Fi', 'Comedy', 
  'Drama', 'Thriller', 'Slice of Life', 'Adventure', 'Mystery', 'Supernatural'
]

export const SOURCES = [
  { id: 'src-1', name: 'MangaPlus', baseUrl: 'https://mangaplus.shueisha.co.jp', enabled: true, type: 'static' },
  { id: 'src-2', name: 'Webtoons', baseUrl: 'https://www.webtoons.com', enabled: true, type: 'static' },
  { id: 'src-3', name: 'MangaDex', baseUrl: 'https://mangadex.org', enabled: true, type: 'js' },
]

export const MOCK_TITLES = [
  { id: 't1', title: 'Solo Leveling', author: 'Chugong', cover: covers(1), genres: ['Action', 'Fantasy', 'Adventure'], status: 'Completed', rating: 4.9, sourceId: 'src-1', sourceName: 'MangaPlus', totalChapters: 179, description: 'In a world where hunters must battle deadly monsters to protect humanity, Sung Jin-Woo, the weakest hunter of all, finds a hidden dungeon with a mysterious program that only he can see. As he levels up, he becomes the most powerful hunter in the world.' },
  { id: 't2', title: 'Tower of God', author: 'SIU', cover: covers(2), genres: ['Action', 'Fantasy', 'Mystery'], status: 'Ongoing', rating: 4.7, sourceId: 'src-2', sourceName: 'Webtoons', totalChapters: 590, description: 'What do you desire? Money and wealth? Honor and pride? Authority and power? Revenge? Or something that transcends them all? Whatever you desire — it is here.' },
  { id: 't3', title: 'Omniscient Reader', author: 'Sing Shong', cover: covers(3), genres: ['Action', 'Fantasy', 'Drama'], status: 'Ongoing', rating: 4.8, sourceId: 'src-3', sourceName: 'MangaDex', totalChapters: 178, description: 'The novel "Three Ways to Survive the Apocalypse" has come to reality, and the only person who read the novel to the end, Dokja Kim, will change the world.' },
  { id: 't4', title: 'The Beginning After The End', author: 'TurtleMe', cover: covers(4), genres: ['Fantasy', 'Adventure', 'Romance'], status: 'Ongoing', rating: 4.8, sourceId: 'src-1', sourceName: 'MangaPlus', totalChapters: 195, description: 'King Grey has unrivaled strength, wealth, and prestige, yet loneliness lingers closely behind those with great power. Reincarnated into a new world, he is given a second chance at life.' },
  { id: 't5', title: 'Eleceed', author: 'Son Jeho', cover: covers(5), genres: ['Action', 'Comedy', 'Supernatural'], status: 'Ongoing', rating: 4.6, sourceId: 'src-2', sourceName: 'Webtoons', totalChapters: 280, description: 'Jiwoo is a kind-hearted young man who harnesses the power of super speed. Kayden is a secret agent hiding in the body of a fat old cat.' },
  { id: 't6', title: 'Nano Machine', author: 'Hanjung Wolya', cover: covers(6), genres: ['Action', 'Sci-Fi', 'Fantasy'], status: 'Ongoing', rating: 4.5, sourceId: 'src-3', sourceName: 'MangaDex', totalChapters: 162, description: 'After being injected with nanomachines by his descendant from the future, a lowly prince of the Demonic Cult rises to power against all odds.' },
  { id: 't7', title: 'Windbreaker', author: 'Yongseok Jo', cover: covers(7), genres: ['Action', 'Drama', 'Slice of Life'], status: 'Ongoing', rating: 4.4, sourceId: 'src-2', sourceName: 'Webtoons', totalChapters: 450, description: 'Jay is a student who just transferred and no one seems to care about him. But everything changes when he discovers the street biking crew called "Hummingbird."' },
  { id: 't8', title: 'Teenage Mercenary', author: 'YC', cover: covers(8), genres: ['Action', 'Drama', 'Thriller'], status: 'Ongoing', rating: 4.3, sourceId: 'src-1', sourceName: 'MangaPlus', totalChapters: 145, description: 'Ijin Yu was a mercenary since childhood. After returning to a normal life as a high schooler, protecting his new family becomes his most important mission.' },
  { id: 't9', title: 'Lookism', author: 'Park Tae-joon', cover: covers(9), genres: ['Action', 'Drama', 'Comedy'], status: 'Ongoing', rating: 4.5, sourceId: 'src-2', sourceName: 'Webtoons', totalChapters: 480, description: 'Daniel Park has a secret — he can switch between two bodies! One is short, overweight, and unattractive. The other is tall, handsome, and well-built.' },
  { id: 't10', title: 'Return of the Mount Hua Sect', author: 'Biga', cover: covers(10), genres: ['Action', 'Fantasy', 'Comedy'], status: 'Ongoing', rating: 4.7, sourceId: 'src-3', sourceName: 'MangaDex', totalChapters: 120, description: 'The 13th disciple of the Mount Hua Sect, one of the greatest swordsmen, Chung Myung, defeated the Heavenly Demon and fell to his death. 100 years later, he wakes up as a beggar.' },
  { id: 't11', title: 'True Beauty', author: 'Yaongyi', cover: covers(11), genres: ['Romance', 'Comedy', 'Drama'], status: 'Completed', rating: 4.3, sourceId: 'src-2', sourceName: 'Webtoons', totalChapters: 222, description: 'After being bullied for her looks, Jugyeong Lim masters the art of makeup and becomes the school goddess. But Su-ho Lee sees her bare face...' },
  { id: 't12', title: 'Bastard', author: 'Carnby Kim', cover: covers(12), genres: ['Thriller', 'Horror', 'Drama'], status: 'Completed', rating: 4.9, sourceId: 'src-2', sourceName: 'Webtoons', totalChapters: 94, description: 'Jin Seon lives with his father — a serial killer. When a girl moves in next door, Jin must choose between protecting her or obeying his father.' },
]

export const generateChapters = (titleId, count) => {
  const chapters = []
  for (let i = 1; i <= count; i++) {
    const daysAgo = Math.floor(Math.random() * 365)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    chapters.push({
      id: `${titleId}-ch${i}`,
      titleId,
      number: i,
      title: i % 5 === 0 ? `Special Chapter` : '',
      releaseDate: date.toISOString(),
      read: i <= Math.floor(count * 0.6)
    })
  }
  return chapters.sort((a, b) => b.number - a.number)
}

export const generateReaderImages = (chapterId, count = 12) => {
  const images = []
  for (let i = 1; i <= count; i++) {
    images.push(`https://picsum.photos/seed/${chapterId}-${i}/800/1200`)
  }
  return images
}

export const CONTINUE_READING = MOCK_TITLES.slice(0, 6).map((t, i) => ({
  ...t,
  lastChapter: Math.floor(t.totalChapters * 0.4) + i * 5,
  progress: 30 + i * 10
}))

export const RECENTLY_UPDATED = MOCK_TITLES.slice(0, 8).map((t, i) => ({
  ...t,
  latestChapter: t.totalChapters,
  updatedAgo: [`2h ago`, `5h ago`, `1d ago`, `2d ago`, `3d ago`, `4d ago`, `5d ago`, `1w ago`][i]
}))

export const POPULAR_THIS_WEEK = [...MOCK_TITLES].sort(() => Math.random() - 0.5).slice(0, 8)

export const NEW_TITLES = MOCK_TITLES.slice(6, 12)

export const FEATURED = MOCK_TITLES.slice(0, 5)

export const MOCK_HISTORY = (() => {
  const history = []
  const now = new Date()
  MOCK_TITLES.slice(0, 8).forEach((t, i) => {
    const hoursAgo = i < 2 ? i * 3 : i < 4 ? 24 + i * 5 : 72 + i * 12
    const readAt = new Date(now - hoursAgo * 3600000)
    history.push({
      id: i + 1,
      titleId: t.id,
      titleName: t.title,
      coverImage: t.cover,
      chapterNum: Math.floor(t.totalChapters * 0.5) + i,
      readAt: readAt.toISOString()
    })
  })
  return history
})()

export const STATS_DATA = {
  totalChaptersRead: 1247,
  totalTitlesStarted: 42,
  totalTitlesCompleted: 8,
  currentStreak: 12,
  longestStreak: 34,
  heatmap: (() => {
    const data = {}
    const now = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      data[key] = Math.random() > 0.4 ? Math.floor(Math.random() * 15) : 0
    }
    return data
  })(),
  genreBreakdown: [
    { genre: 'Action', count: 380 },
    { genre: 'Fantasy', count: 290 },
    { genre: 'Romance', count: 180 },
    { genre: 'Drama', count: 150 },
    { genre: 'Comedy', count: 120 },
    { genre: 'Thriller', count: 67 },
    { genre: 'Other', count: 60 },
  ],
  dailyActivity: (() => {
    const data = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      data.push({
        date: d.toISOString().split('T')[0],
        chapters: Math.floor(Math.random() * 12)
      })
    }
    return data
  })(),
  topTitles: [
    { title: 'Solo Leveling', chapters: 179 },
    { title: 'Tower of God', chapters: 342 },
    { title: 'Omniscient Reader', chapters: 178 },
    { title: 'Lookism', chapters: 290 },
    { title: 'Bastard', chapters: 94 },
  ]
}
