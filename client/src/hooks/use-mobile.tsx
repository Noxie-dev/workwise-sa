
import * as React from "react"

const MOBILE_BREAKPOINT = 640 // Align with Tailwind's sm breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    window.addEventListener('resize', onChange)
    mql.addEventListener("change", onChange)
    
    return () => {
      window.removeEventListener('resize', onChange)
      mql.removeEventListener("change", onChange)
    }
  }, [])

  return isMobile
}
