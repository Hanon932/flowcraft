import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useFlowStore } from '../store'
import type { StepNode } from '../types'

export default function ManualPanel() {
  const mode = useFlowStore((s) => s.mode)
  const node = useFlowStore((s) => s.selectedNode()) as StepNode | undefined
  const updateStep = useFlowStore((s) => s.updateStep)
  const deleteStep = useFlowStore((s) => s.deleteStep)
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId)
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-300">
        図形をクリックすると、
        <br />
        ステップのマニュアルがここに表示されます。
      </div>
    )
  }

  const isEdit = mode === 'edit'

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 p-3">
        <span className="text-xs font-medium text-neutral-400">ステップの詳細</span>
        <div className="flex items-center gap-1">
          {isEdit && (
            <button
              type="button"
              onClick={() => deleteStep(node.id)}
              className="rounded-full px-2.5 py-1 text-xs text-red-400 hover:bg-red-50"
            >
              削除
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelectedNodeId(null)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-3">
        {isEdit ? (
          <input
            value={node.data.title}
            onChange={(e) => updateStep(node.id, { title: e.target.value })}
            placeholder="ステップ名"
            className="w-full rounded-xl bg-neutral-100 px-3 py-2 text-sm font-semibold outline-none ring-1 ring-transparent focus:bg-white focus:ring-sky-400"
          />
        ) : (
          <h3 className="text-sm font-semibold text-neutral-800">
            {node.data.title}
          </h3>
        )}
      </div>

      {isEdit && (
        <div className="flex gap-1 px-3">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              tab === 'edit'
                ? 'bg-sky-100 font-medium text-sky-600'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              tab === 'preview'
                ? 'bg-sky-100 font-medium text-sky-600'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            プレビュー
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isEdit && tab === 'edit' ? (
          <textarea
            value={node.data.manual}
            onChange={(e) => updateStep(node.id, { manual: e.target.value })}
            placeholder={'このステップの手順をMarkdownで書けます。\n\n例:\n1. ボタンを押す\n2. 内容を確認する'}
            className="h-full w-full resize-none rounded-xl bg-neutral-100 p-3 font-mono text-xs leading-relaxed outline-none ring-1 ring-transparent focus:bg-white focus:ring-sky-400"
          />
        ) : node.data.manual ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{node.data.manual}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm italic text-neutral-300">まだマニュアルが書かれていません。</p>
        )}
      </div>
    </div>
  )
}
