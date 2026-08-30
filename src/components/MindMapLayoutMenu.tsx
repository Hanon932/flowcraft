import { useRef, useState } from 'react'
import { useClickOutside } from '../lib/useClickOutside'
import { useFlowStore } from '../store'
import FloatingMenu from './FloatingMenu'

export default function MindMapLayoutMenu() {
  const applyMindMapLayout = useFlowStore((s) => s.applyMindMapLayout)
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useClickOutside(open, () => setOpen(false), [buttonRef, menuRef])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
      >
        整列
      </button>
      <FloatingMenu
        ref={menuRef}
        anchorRef={buttonRef}
        open={open}
        className="w-48 rounded-xl bg-white p-1 shadow-lg ring-1 ring-neutral-200"
      >
        <button
          type="button"
          onClick={() => {
            applyMindMapLayout('radial')
            setOpen(false)
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-neutral-600 hover:bg-sky-50"
        >
          <span>✺</span>
          <span>放射状に整列</span>
        </button>
        <button
          type="button"
          onClick={() => {
            applyMindMapLayout('tree')
            setOpen(false)
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-neutral-600 hover:bg-sky-50"
        >
          <span>▤</span>
          <span>ロードマップ風に整列</span>
        </button>
      </FloatingMenu>
    </div>
  )
}
