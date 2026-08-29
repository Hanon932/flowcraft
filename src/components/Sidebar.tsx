import { useState } from 'react'
import { useFlowStore } from '../store'

export default function Sidebar() {
  const docs = useFlowStore((s) => s.docs)
  const activeId = useFlowStore((s) => s.activeId)
  const setActiveId = useFlowStore((s) => s.setActiveId)
  const createFlow = useFlowStore((s) => s.createFlow)
  const renameFlow = useFlowStore((s) => s.renameFlow)
  const deleteFlow = useFlowStore((s) => s.deleteFlow)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  return (
    <div className="flex h-full w-56 flex-col border-r border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between p-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          フロー一覧
        </span>
        <button
          type="button"
          onClick={createFlow}
          title="新しいフローを作成"
          className="rounded bg-violet-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-violet-700"
        >
          + 新規
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {docs.map((d) => (
          <div
            key={d.id}
            onClick={() => setActiveId(d.id)}
            className={`group mb-1 flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm ${
              d.id === activeId
                ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            {editingId === d.id ? (
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => {
                  renameFlow(d.id, draftName.trim() || d.name)
                  setEditingId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded border border-violet-400 bg-white px-1 text-sm outline-none dark:bg-neutral-800"
              />
            ) : (
              <span
                className="truncate"
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setEditingId(d.id)
                  setDraftName(d.name)
                }}
              >
                {d.name}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`「${d.name}」を削除しますか？`)) deleteFlow(d.id)
              }}
              className="ml-1 hidden shrink-0 text-neutral-400 hover:text-red-500 group-hover:block"
              title="削除"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
