import { memo, useEffect, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { useFlowStore } from '../store'
import type { MilestoneStatus, MindMapNodeData } from '../types'

const handleClass =
  'h-2 w-2 !border-2 !border-white !bg-[#0071e3] opacity-0 transition-opacity group-hover:opacity-100'

const HANDLE_SIDES: { position: Position; id: string }[] = [
  { position: Position.Top, id: 'top' },
  { position: Position.Right, id: 'right' },
  { position: Position.Bottom, id: 'bottom' },
  { position: Position.Left, id: 'left' },
]

const STATUS_ORDER: MilestoneStatus[] = ['todo', 'doing', 'done']

const STATUS_LABEL: Record<MilestoneStatus, string> = {
  todo: '未着手',
  doing: '進行中',
  done: '達成',
}

const STATUS_BADGE_CLASS: Record<MilestoneStatus, string> = {
  todo: 'bg-white text-[#c7c7cc] ring-1 ring-[#d2d2d7]',
  doing: 'bg-[#ff9500] text-white',
  done: 'bg-[#34c759] text-white',
}

const STATUS_ICON: Record<MilestoneStatus, string> = {
  todo: '○',
  doing: '◐',
  done: '✓',
}

const STATUS_BORDER_COLOR: Record<MilestoneStatus, string | undefined> = {
  todo: undefined,
  doing: '#ff9500',
  done: '#34c759',
}

function TopicNode({ id, data, selected }: NodeProps<MindMapNodeData>) {
  const mode = useFlowStore((s) => s.mode)
  const updateStep = useFlowStore((s) => s.updateStep)
  const deleteStep = useFlowStore((s) => s.deleteStep)
  const [editing, setEditing] = useState(false)
  const isEdit = mode === 'edit'
  const isRoot = Boolean(data.root)
  const status = data.status ?? 'todo'
  const color = STATUS_BORDER_COLOR[status] ?? data.color ?? '#0071e3'
  const hasChildren = Boolean(data.hasChildren)
  const hiddenCount = typeof data.hiddenCount === 'number' ? data.hiddenCount : 0
  const progressTotal = typeof data.progressTotal === 'number' ? data.progressTotal : 0
  const progressDone = typeof data.progressDone === 'number' ? data.progressDone : 0

  useEffect(() => {
    if (selected && data.text === '' && isEdit) {
      setEditing(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  function cycleStatus() {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(status) + 1) % STATUS_ORDER.length]
    updateStep(id, { status: next })
  }

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
        <input
          autoFocus
          value={data.text}
          onChange={(e) => updateStep(id, { text: e.target.value })}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur()
          }}
          style={{ minWidth: 120 }}
          className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm outline-none ring-2 ring-[#0071e3] ${
            isRoot ? 'bg-[#0071e3] text-white' : 'bg-white text-[#1d1d1f]'
          }`}
        />
      ) : (
        <div
          onDoubleClick={() => {
            if (!isEdit) return
            setEditing(true)
          }}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow duration-200 ${
            isRoot ? 'bg-[#0071e3] text-white' : 'bg-white text-[#1d1d1f]'
          } ${selected ? 'ring-2 ring-[#0071e3]' : !isRoot ? 'border-2' : ''}`}
          style={!isRoot && !selected ? { borderColor: color } : undefined}
        >
          {data.text || '（無題）'}
        </div>
      )}

      {isEdit && !isRoot && (
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

      {!isRoot && (
        <button
          type="button"
          title={isEdit ? `状況を切り替え（現在: ${STATUS_LABEL[status]}）` : STATUS_LABEL[status]}
          onClick={
            isEdit
              ? (e) => {
                  e.stopPropagation()
                  cycleStatus()
                }
              : undefined
          }
          className={`absolute -bottom-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-md transition-transform ${STATUS_BADGE_CLASS[status]} ${
            isEdit ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          }`}
        >
          {STATUS_ICON[status]}
        </button>
      )}

      {isRoot && progressTotal > 0 && (
        <span className="absolute -bottom-2 -right-2 z-10 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#0071e3] shadow-md ring-1 ring-[#d2d2d7]">
          {progressDone}/{progressTotal} 達成
        </span>
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
