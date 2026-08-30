import { memo, useEffect, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { useFlowStore } from '../store'
import type { MindMapNodeData } from '../types'

const handleClass =
  'h-2 w-2 !border-2 !border-white !bg-sky-500 opacity-0 transition-opacity group-hover:opacity-100'

function TopicNode({ id, data, selected }: NodeProps<MindMapNodeData>) {
  const mode = useFlowStore((s) => s.mode)
  const updateStep = useFlowStore((s) => s.updateStep)
  const deleteStep = useFlowStore((s) => s.deleteStep)
  const [editing, setEditing] = useState(false)
  const isEdit = mode === 'edit'
  const isRoot = Boolean(data.root)
  const color = data.color ?? '#0ea5e9'

  useEffect(() => {
    if (selected && data.text === '' && isEdit) {
      setEditing(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  return (
    <div className="group relative">
      <Handle type="target" position={Position.Top} id="top" isConnectableStart isConnectableEnd className={handleClass} />
      <Handle type="source" position={Position.Right} id="right" isConnectableStart isConnectableEnd className={handleClass} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectableStart isConnectableEnd className={handleClass} />
      <Handle type="source" position={Position.Left} id="left" isConnectableStart isConnectableEnd className={handleClass} />

      {editing ? (
        <input
          autoFocus
          value={data.text}
          onChange={(e) => updateStep(id, { text: e.target.value })}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          style={{ minWidth: 120 }}
          className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm outline-none ring-2 ring-sky-400 ${
            isRoot ? 'bg-sky-500 text-white' : 'bg-white text-neutral-800'
          }`}
        />
      ) : (
        <div
          onDoubleClick={() => {
            if (!isEdit) return
            setEditing(true)
          }}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-shadow ${
            isRoot ? 'bg-sky-500 text-white' : 'bg-white text-neutral-700'
          } ${selected ? 'ring-2 ring-sky-400' : !isRoot ? 'border-2' : ''}`}
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
          className="absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-neutral-400 opacity-0 shadow-md ring-1 ring-neutral-200 transition-opacity hover:text-red-500 group-hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  )
}

export default memo(TopicNode)
