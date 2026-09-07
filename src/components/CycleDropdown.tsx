import { useRef, useState } from 'react'
import { useClickOutside } from '../lib/useClickOutside'
import type { PdcaCycle } from '../types'
import FloatingMenu from './FloatingMenu'

export default function CycleDropdown({
  cycles,
  activeCycle,
  onSelect,
}: {
  cycles: PdcaCycle[]
  activeCycle: PdcaCycle | undefined
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useClickOutside(open, () => setOpen(false), [buttonRef, menuRef])

  return (
    <div>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={cycles.length === 0}
        className="flex items-center gap-1.5 rounded-full bg-[#f5f5f7] py-1.5 pl-3.5 pr-2.5 text-xs font-medium text-[#1d1d1f] transition-colors duration-200 hover:bg-black/[0.06] disabled:cursor-default disabled:hover:bg-[#f5f5f7]"
      >
        <span>{activeCycle?.title ?? 'サイクルがありません'}</span>
        {cycles.length > 0 && (
          <svg
            width="9"
            height="9"
            viewBox="0 0 10 6"
            fill="none"
            className={`shrink-0 text-[#86868b] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <FloatingMenu
        ref={menuRef}
        anchorRef={buttonRef}
        open={open}
        className="w-56 overflow-hidden rounded-2xl bg-white/95 p-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-md"
      >
        {cycles.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              onSelect(c.id)
              setOpen(false)
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors duration-150 ${
              c.id === activeCycle?.id
                ? 'bg-[#0071e3]/10 font-medium text-[#0071e3]'
                : 'text-[#1d1d1f] hover:bg-black/[0.04]'
            }`}
          >
            <span className="truncate">{c.title}</span>
            {c.id === activeCycle?.id && (
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path
                  d="M3 8.5L6.5 12L13 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        ))}
      </FloatingMenu>
    </div>
  )
}
