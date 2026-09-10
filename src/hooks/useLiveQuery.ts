import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage, LIVE_QUERY_TIMEOUT_MS, LIVE_REFRESH_MS } from '@/lib/catalog'

const TIMEOUT_MESSAGE = 'The catalog service is taking too long to respond. Please try again.'

export function useLiveQuery<T>(query: (signal: AbortSignal) => Promise<T>, initial: T) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const generation = useRef({ value: 0 })
  const activeRequest = useRef<AbortController | null>(null)
  const refetch = useCallback(async () => {
    const request = ++generation.current.value
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    let timedOut = false
    const timeout = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, LIVE_QUERY_TIMEOUT_MS)
    try {
      const result = await query(controller.signal)
      if (generation.current.value === request) { setData(result); setError(null) }
      return result
    } catch (err) {
      if (generation.current.value === request) setError(timedOut ? TIMEOUT_MESSAGE : errorMessage(err))
      return null
    } finally {
      window.clearTimeout(timeout)
      if (activeRequest.current === controller) activeRequest.current = null
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
      activeRequest.current?.abort()
      activeRequest.current = null
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('online', refresh)
      window.removeEventListener('catalog-changed', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [refetch])
  return { data, loading, error, refetch }
}
