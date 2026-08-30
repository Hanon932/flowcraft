import { forwardRef, useLayoutEffect, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface FloatingMenuProps {
  anchorRef: RefObject<HTMLElement | null>
  open: boolean
  align?: 'left' | 'right'
  className?: string
  children: ReactNode
}

const FloatingMenu = forwardRef<HTMLDivElement, FloatingMenuProps>(function FloatingMenu(
  { anchorRef, open, align = 'left', className, children },
  ref,
) {
  const [style, setStyle] = useState<CSSProperties | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setStyle(null)
      return
    }
    const rect = anchorRef.current.getBoundingClientRect()
    setStyle(
      align === 'right'
        ? {
            position: 'fixed',
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right,
            zIndex: 9999,
          }
        : { position: 'fixed', top: rect.bottom + 4, left: rect.left, zIndex: 9999 },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align])

  if (!open || !style) return null

  return createPortal(
    <div ref={ref} style={style} className={className}>
      {children}
    </div>,
    document.body,
  )
})

export default FloatingMenu
