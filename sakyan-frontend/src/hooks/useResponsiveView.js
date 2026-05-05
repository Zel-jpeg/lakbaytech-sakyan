import { useState, useEffect } from 'react'

/**
 * Returns a [viewMode, setViewMode] pair.
 * - On mobile (< 640px): defaults to 'card' (better UX on small screens)
 * - On desktop: defaults to the provided defaultDesktop (usually 'list')
 * Switching is still manual via the toggle buttons.
 */
export function useResponsiveView(defaultDesktop = 'list') {
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 640
  const [viewMode, setViewMode] = useState(() => isMobile() ? 'card' : defaultDesktop)

  useEffect(() => {
    const handler = () => {
      setViewMode(prev => {
        // Only auto-switch if user hasn't manually changed it in this session
        // We don't force-override user choice, just set initial
        return prev
      })
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // On first mount set based on screen size
  useEffect(() => {
    setViewMode(isMobile() ? 'card' : defaultDesktop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [viewMode, setViewMode]
}
