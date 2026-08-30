import { useEffect, type RefObject } from 'react'

export function useClickOutside(
  active: boolean,
  onOutside: () => void,
  refs: RefObject<HTMLElement | null>[],
) {
  useEffect(() => {
    if (!active) return
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      const isInside = refs.some((r) => r.current && r.current.contains(target))
      if (!isInside) onOutside()
    }
    document.addEventListener('mousedown', handlePointerDown, true)
    return () => document.removeEventListener('mousedown', handlePointerDown, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onOutside])
}
