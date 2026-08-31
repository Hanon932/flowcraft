import { useState } from 'react'
import { useFlowStore, useUiStore, type UiSection } from '../store'

const TABS: { key: UiSection; label: string }[] = [
  { key: 'flowchart', label: 'フローチャート' },
  { key: 'mindmap', label: 'マインドマップ' },
  { key: 'freeform', label: 'ホワイトボード' },
  { key: 'reflection', label: '振り返り' },
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
  const section = useUiStore((s) => s.section)
  const setSection = useUiStore((s) => s.setSection)

  const visibleDocs =
    section === 'reflection' ? [] : docs.filter((d) => (d.kind ?? 'flowchart') === section)

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-white/5 bg-slate-950/70 backdrop-blur-sm">
      <div className="flex flex-col gap-1 border-b border-white/5 p-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSection(t.key)}
            className={`rounded-full px-3 py-1.5 text-left text-xs font-medium transition-colors ${
              section === t.key
                ? 'bg-violet-500/15 text-violet-300 shadow-[0_0_0_1px_rgba(139,92,246,0.35)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {section === 'reflection' ? (
          <p className="px-4 py-4 text-xs leading-relaxed text-slate-500">
            毎日の反省点・改善点を記録できます。日々の出来事ではなく、次に活かすポイントだけを残す場所です。
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                一覧
              </span>
              <button
                type="button"
                onClick={() => createFlow(section)}
                title="新規作成"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-sm font-bold text-white shadow-sm shadow-violet-900/50 hover:bg-violet-400"
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
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'text-slate-400 hover:bg-white/5'
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
                      className="w-full rounded-lg bg-slate-800 px-1.5 py-0.5 text-sm text-slate-100 outline-none ring-1 ring-violet-500"
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
                    className="ml-1 hidden shrink-0 rounded-full px-1.5 text-slate-600 hover:bg-rose-500/10 hover:text-rose-400 group-hover:block"
                    title="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
              {visibleDocs.length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-slate-600">
                  まだありません。「+」から作成できます。
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
