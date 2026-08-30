import { useState } from 'react'
import { useFlowStore } from '../store'
import type { DocKind } from '../types'

const TABS: { key: DocKind; label: string }[] = [
  { key: 'flowchart', label: 'フローチャート' },
  { key: 'mindmap', label: 'マインドマップ' },
]

export default function Sidebar() {
  const docs = useFlowStore((s) => s.docs)
  const activeId = useFlowStore((s) => s.activeId)
  const setActiveId = useFlowStore((s) => s.setActiveId)
  const createFlow = useFlowStore((s) => s.createFlow)
  const renameFlow = useFlowStore((s) => s.renameFlow)
  const deleteFlow = useFlowStore((s) => s.deleteFlow)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [section, setSection] = useState<DocKind>('flowchart')

  const visibleDocs = docs.filter((d) => (d.kind ?? 'flowchart') === section)

  return (
    <div className="flex h-full w-56 flex-col bg-neutral-50">
      <div className="flex gap-1 p-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSection(t.key)}
            className={`flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors ${
              section === t.key
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          一覧
        </span>
        <button
          type="button"
          onClick={() => createFlow(section)}
          title="新規作成"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white shadow-sm shadow-sky-200 hover:bg-sky-600"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {visibleDocs.map((d) => (
          <div
            key={d.id}
            onClick={() => setActiveId(d.id)}
            className={`group mb-1 flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
              d.id === activeId
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-neutral-500 hover:bg-white/60'
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
                className="w-full rounded-lg bg-white px-1.5 py-0.5 text-sm outline-none ring-1 ring-sky-400"
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
              className="ml-1 hidden shrink-0 rounded-full px-1.5 text-neutral-300 hover:bg-red-50 hover:text-red-500 group-hover:block"
              title="削除"
            >
              ×
            </button>
          </div>
        ))}
        {visibleDocs.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-neutral-300">
            まだありません。「+」から作成できます。
          </p>
        )}
      </div>
    </div>
  )
}
