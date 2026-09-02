import { memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { type NodeProps } from 'reactflow'
import { useClickOutside } from '../lib/useClickOutside'
import { useFlowStore } from '../store'
import type { StickyNoteData } from '../types'

const NOTE_COLORS = ['#fff59d', '#ffccbc', '#c8e6c9', '#bbdefb', '#e1bee7', '#f5f5f5']
const DEFAULT_COLOR = NOTE_COLORS[0]

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function StickyNoteNode({ id, data, selected }: NodeProps<StickyNoteData>) {
  const mode = useFlowStore((s) => s.mode)
  const updateStep = useFlowStore((s) => s.updateStep)
  const deleteStep = useFlowStore((s) => s.deleteStep)
  const [editing, setEditing] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  useClickOutside(Boolean(contextMenuPos), () => setContextMenuPos(null), [contextMenuRef])
  const isEdit = mode === 'edit'
  const color = data.color ?? DEFAULT_COLOR

  useEffect(() => {
    if (selected && data.text === '' && isEdit) setEditing(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useEffect(() => {
    if (editing && textareaRef.current) autoResize(textareaRef.current)
  }, [editing])

  return (
    <div className="group relative">
      <div
        onContextMenu={(e) => {
          if (!isEdit) return
          e.preventDefault()
          e.stopPropagation()
          setContextMenuPos({ x: e.clientX, y: e.clientY })
        }}
        className={`min-h-[100px] min-w-[160px] max-w-[240px] rounded-sm p-3 shadow-[0_2px_6px_rgba(0,0,0,0.12)] ${
          selected ? 'ring-2 ring-[#0071e3]' : ''
        }`}
        style={{ backgroundColor: color }}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            autoFocus
            value={data.text}
            onChange={(e) => {
              updateStep(id, { text: e.target.value })
              autoResize(e.target)
            }}
            onFocus={(e) => e.target.select()}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Escape') e.currentTarget.blur()
            }}
            placeholder="メモを入力…"
            className="w-full resize-none overflow-hidden bg-transparent text-sm leading-relaxed text-[#3d3d3d] outline-none placeholder:text-[#3d3d3d]/50"
          />
        ) : (
          <div
            onDoubleClick={() => isEdit && setEditing(true)}
            className="min-h-[1.5em] whitespace-pre-wrap break-words text-sm leading-relaxed text-[#3d3d3d]"
          >
            {data.text || (isEdit ? 'ダブルクリックでメモを入力…' : '')}
          </div>
        )}
      </div>

      {isEdit && (
        <button
          type="button"
          title="削除"
          onClick={(e) => {
            e.stopPropagation()
            deleteStep(id)
          }}
          className="absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-[#86868b] opacity-0 shadow-md ring-1 ring-[#d2d2d7] transition-opacity hover:text-[#ff3b30] group-hover:opacity-100"
        >
          ×
        </button>
      )}

      {contextMenuPos &&
        createPortal(
          <div
            ref={contextMenuRef}
            style={{ position: 'fixed', top: contextMenuPos.y, left: contextMenuPos.x, zIndex: 9999 }}
            className="w-40 rounded-xl bg-white p-1 shadow-lg ring-1 ring-[#d2d2d7]"
          >
            <div className="px-2 py-1 text-[10px] font-medium text-[#86868b]">色を変更</div>
            <div className="grid grid-cols-3 gap-1 px-2 pb-1">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    updateStep(id, { color: c })
                    setContextMenuPos(null)
                  }}
                  className={`h-6 w-6 rounded-full ring-1 ${
                    color === c ? 'ring-2 ring-[#0071e3]' : 'ring-black/10'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default memo(StickyNoteNode)
