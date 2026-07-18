import axios from 'axios'

async function testMangaDex() {
  const query = 'solo'
  const res = await axios.get(`https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&includes[]=cover_art&limit=3`)
  
  for (const manga of res.data.data) {
    const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0]
    const coverRel = manga.relationships.find(r => r.type === 'cover_art')
    const coverFile = coverRel ? coverRel.attributes.fileName : null
    const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}.256.jpg` : ''
    
    console.log({ id: manga.id, title, coverUrl })
    
    // Test chapters
    const chRes = await axios.get(`https://api.mangadex.org/manga/${manga.id}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=5`)
    console.log("Chapters:", chRes.data.data.map(c => ({ ch: c.attributes.chapter, title: c.attributes.title, id: c.id })))
    
    if (chRes.data.data.length > 0) {
      const firstCh = chRes.data.data[0]
      const readRes = await axios.get(`https://api.mangadex.org/at-home/server/${firstCh.id}`)
      const host = readRes.data.baseUrl
      const hash = readRes.data.chapter.hash
      const data = readRes.data.chapter.data
      console.log("Images:", data.map(i => `${host}/data/${hash}/${i}`).slice(0, 2))
    }
    
    break;
  }
}
testMangaDex()
