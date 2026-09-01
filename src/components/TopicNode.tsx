import { memo, useEffect, useRef, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { useFlowStore } from '../store'
import type { MindMapNodeData } from '../types'

const handleClass =
  'h-2 w-2 !border-2 !border-white !bg-[#0071e3] opacity-0 transition-opacity group-hover:opacity-100'

const HANDLE_SIDES: { position: Position; id: string }[] = [
  { position: Position.Top, id: 'top' },
  { position: Position.Right, id: 'right' },
  { position: Position.Bottom, id: 'bottom' },
  { position: Position.Left, id: 'left' },
]

const MAX_TEXT_WIDTH = 220

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function TopicNode({ id, data, selected }: NodeProps<MindMapNodeData>) {
  const mode = useFlowStore((s) => s.mode)
  const updateStep = useFlowStore((s) => s.updateStep)
  const editRequestNodeId = useFlowStore((s) => s.editRequestNodeId)
  const clearEditRequest = useFlowStore((s) => s.clearEditRequest)
  const [editing, setEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isEdit = mode === 'edit'
  const isRoot = Boolean(data.root)
  const color = data.color ?? '#0071e3'
  const hasChildren = Boolean(data.hasChildren)
  const hiddenCount = typeof data.hiddenCount === 'number' ? data.hiddenCount : 0

  useEffect(() => {
    if (selected && data.text === '' && isEdit) {
      setEditing(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useEffect(() => {
    if (editRequestNodeId === id) {
      setEditing(true)
      clearEditRequest()
    }
  }, [editRequestNodeId, id, clearEditRequest])

  useEffect(() => {
    if (editing && textareaRef.current) autoResize(textareaRef.current)
  }, [editing])

  return (
    <div className="group relative">
      {HANDLE_SIDES.map(({ position, id }) => (
        <div key={id}>
          <Handle
            type="target"
            position={position}
            id={id}
            isConnectableStart
            isConnectableEnd
            className={handleClass}
          />
          <Handle
            type="source"
            position={position}
            id={id}
            isConnectableStart
            isConnectableEnd
            className={handleClass}
          />
        </div>
      ))}

      {editing ? (
        <textarea
          ref={textareaRef}
          autoFocus
          rows={1}
          value={data.text}
          onChange={(e) => {
            updateStep(id, { text: e.target.value })
            autoResize(e.target)
          }}
          onFocus={(e) => e.target.select()}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.blur()
            }
            if (e.key === 'Escape') e.currentTarget.blur()
          }}
          style={{ width: MAX_TEXT_WIDTH }}
          className={`resize-none overflow-hidden rounded-2xl px-4 py-2 text-center text-sm font-medium leading-snug shadow-sm outline-none ring-2 ring-[#0071e3] ${
            isRoot ? 'bg-[#0071e3] text-white' : 'bg-white text-[#1d1d1f]'
          }`}
        />
      ) : (
        <div
          onDoubleClick={() => {
            if (!isEdit) return
            setEditing(true)
          }}
          style={{
            maxWidth: MAX_TEXT_WIDTH,
            ...(!isRoot && !selected ? { borderColor: color } : undefined),
          }}
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-center text-sm font-medium leading-snug shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow duration-200 ${
            isRoot ? 'bg-[#0071e3] text-white' : 'bg-white text-[#1d1d1f]'
          } ${selected ? 'ring-2 ring-[#0071e3]' : !isRoot ? 'border-2' : ''}`}
        >
          {data.text || '（無題）'}
        </div>
      )}

      {hasChildren && (
        <button
          type="button"
          title={data.collapsed ? '展開する' : '折りたたむ'}
          onClick={(e) => {
            e.stopPropagation()
            updateStep(id, { collapsed: !data.collapsed })
          }}
          className={`absolute -top-2 -right-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-bold shadow-md ring-1 transition-opacity ${
            data.collapsed
              ? 'bg-[#0071e3] text-white ring-[#0071e3]'
              : 'bg-white text-[#86868b] opacity-0 ring-[#d2d2d7] hover:text-[#0071e3] group-hover:opacity-100'
          }`}
        >
          {data.collapsed ? `+${hiddenCount}` : '−'}
        </button>
      )}
    </div>
  )
}

export default memo(TopicNode)
