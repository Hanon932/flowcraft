import { useRef, useState } from 'react'
import { useClickOutside } from '../lib/useClickOutside'
import { useFlowStore } from '../store'
import type { MindMapLayoutStyle } from '../types'
import FloatingMenu from './FloatingMenu'

const LAYOUTS: { key: MindMapLayoutStyle; icon: string; label: string }[] = [
  { key: 'radial', icon: '✺', label: '放射状（ヒトデ型）' },
  { key: 'tree', icon: '▤', label: 'ロードマップ風（右向き）' },
  { key: 'vertical', icon: '▥', label: '縦ツリー' },
  { key: 'balanced', icon: '⇋', label: '左右バランス型' },
]

export default function MindMapLayoutMenu() {
  const applyMindMapLayout = useFlowStore((s) => s.applyMindMapLayout)
  const autoLayout = useFlowStore((s) => s.activeDoc().mindMapAutoLayout ?? null)
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
        className={`rounded-full px-3 py-1.5 text-xs transition-colors duration-200 ${
          autoLayout
            ? 'bg-[#0071e3]/10 text-[#0071e3]'
            : 'text-[#86868b] hover:bg-black/[0.03]'
        }`}
      >
        整列{autoLayout ? '中' : ''}
      </button>
      <FloatingMenu
        ref={menuRef}
        anchorRef={buttonRef}
        open={open}
        className="w-52 rounded-xl bg-white p-1 shadow-lg ring-1 ring-[#d2d2d7]"
      >
        <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-[#86868b]">
          自動整列（常に維持）
        </div>
        {LAYOUTS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => {
              applyMindMapLayout(l.key)
              setOpen(false)
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-[#0071e3]/10 ${
              autoLayout === l.key ? 'text-[#0071e3]' : 'text-[#1d1d1f]'
            }`}
          >
            <span>{autoLayout === l.key ? '✓' : l.icon}</span>
            <span>{l.label}</span>
          </button>
        ))}
        {autoLayout && (
          <>
            <div className="my-1 h-px bg-[#d2d2d7]" />
            <button
              type="button"
              onClick={() => {
                applyMindMapLayout(null)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[#86868b] hover:bg-black/[0.03]"
            >
              <span>✕</span>
              <span>自動整列をオフにする（自由配置）</span>
            </button>
          </>
        )}
      </FloatingMenu>
    </div>
  )
}
