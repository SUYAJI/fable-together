/**
 * Mobile Detection Hook
 * 
 * Detects if the current viewport should use compact navigation (below 1024px).
 * Uses window.matchMedia for efficient responsive detection.
 * 
 * @returns boolean indicating if viewport is mobile-sized
 */

import * as React from 'react'

const MOBILE_BREAKPOINT = 1024

/**
 * Hook to detect if the current viewport is mobile-sized
 * 
 * Uses media query listener for efficient detection and updates
 * automatically when window is resized.
 * 
 * @returns true if viewport width is less than 1024px, false otherwise
 * 
 * @example
 * const isMobile = useIsMobile()
 * return <div>{isMobile ? 'Mobile View' : 'Desktop View'}</div>
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
