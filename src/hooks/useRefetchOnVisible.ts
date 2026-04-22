import { useEffect, useRef } from 'react'

/**
 * Fires `refetch` whenever the browser tab becomes visible again (i.e. the
 * user returns from a backgrounded tab or a locked phone screen).
 *
 * Why: Supabase realtime pushes updates via WebSocket, but mobile browsers
 * aggressively suspend backgrounded tabs. When the tab wakes back up, the
 * WebSocket reconnects but does NOT replay events missed during the gap.
 * Calling `refetch` on visibility restore closes that hole.
 *
 * The callback is tracked via a ref so callers don't need to memoize it.
 */
export function useRefetchOnVisible(refetch: () => void | Promise<void>) {
  const latest = useRef(refetch)

  useEffect(() => {
    latest.current = refetch
  }, [refetch])

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void latest.current()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])
}
