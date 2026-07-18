import axios from 'axios'

async function getHTML() {
  const res = await axios.get('https://manganato.com/search/story/solo')
  console.log(res.data.substring(0, 5000))
}
getHTML()
