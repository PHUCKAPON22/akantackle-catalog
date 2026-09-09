import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage, LIVE_REFRESH_MS } from '@/lib/catalog'
export function useLiveQuery<T>(query: () => Promise<T>, initial: T) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const generation = useRef({ value: 0 })
  const refetch = useCallback(async () => {
    const request = ++generation.current.value
    try {
      const result = await query()
      if (generation.current.value === request) { setData(result); setError(null) }
      return result
    } catch (err) {
      if (generation.current.value === request) setError(errorMessage(err))
      return null
    } finally {
      if (generation.current.value === request) setLoading(false)
    }
  }, [query])
  useEffect(() => {
    const lifecycle = generation.current
    setLoading(true)
    void refetch()
    const refresh = () => { if (document.visibilityState === 'visible') void refetch() }
    const timer = window.setInterval(refresh, LIVE_REFRESH_MS)
    window.addEventListener('focus', refresh)
    window.addEventListener('online', refresh)
    window.addEventListener('catalog-changed', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      lifecycle.value++
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('online', refresh)
      window.removeEventListener('catalog-changed', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [refetch])
  return { data, loading, error, refetch }
}
