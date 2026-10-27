import { useEffect, useRef, useState } from 'react'

// Tracks scroll progress (0..1) across the element's scrollable range.
// Returns a ref to attach to the scroll container (defaults to window) plus the
// latest progress value. The 3D showcase maps this to camera keyframes, mirroring
// the jewelry reference's cam-view-1/2/3 scroll stages.
export default function useScrollProgress() {
  const progressRef = useRef(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    function update() {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      progressRef.current = p
      setProgress(p)
      frame = 0
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return { progress, progressRef }
}
