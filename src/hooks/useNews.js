import { useState, useEffect } from 'react'
import { fallbackHeadlines } from '../data/newsHeadlines'

// To use live news, set your NewsAPI key here or in .env as VITE_NEWS_API_KEY
// Get a free key at https://newsapi.org
// Without a key, the app uses static fallback headlines.
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || ''
const NEWS_QUERY   = 'Israel Iran war missile OR airstrike OR strike'
const REFRESH_MS   = 5 * 60 * 1000 // Refresh every 5 minutes

export function useNews() {
  const [headlines, setHeadlines] = useState(fallbackHeadlines)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!NEWS_API_KEY) return // Use fallback silently

    const fetchNews = async () => {
      setLoading(true)
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(NEWS_QUERY)}&sortBy=publishedAt&pageSize=30&apiKey=${NEWS_API_KEY}`
        const res  = await fetch(url)
        const data = await res.json()
        if (data.status === 'ok' && data.articles?.length) {
          setHeadlines(
            data.articles.map((a) => ({
              title:  a.title,
              source: a.source?.name ?? 'Unknown',
              time:   timeAgo(a.publishedAt),
              url:    a.url,
            }))
          )
        }
      } catch (err) {
        setError(err.message)
        // Keep showing fallback
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
    const id = setInterval(fetchNews, REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  return { headlines, loading, error }
}

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
