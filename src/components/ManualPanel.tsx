import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useFlowStore } from '../store'

export default function ManualPanel() {
  const mode = useFlowStore((s) => s.mode)
  const node = useFlowStore((s) => s.selectedNode())
  const updateStep = useFlowStore((s) => s.updateStep)
  const deleteStep = useFlowStore((s) => s.deleteStep)
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId)
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-400">
        図形をクリックすると、
        <br />
        ステップのマニュアルがここに表示されます。
      </div>
    )
  }

  const isEdit = mode === 'edit'

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 p-3 dark:border-neutral-700">
        <span className="text-xs font-medium text-neutral-400">ステップの詳細</span>
        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={() => deleteStep(node.id)}
              className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              削除
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelectedNodeId(null)}
            className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            閉じる
          </button>
        </div>
      </div>

      <div className="p-3">
        {isEdit ? (
          <input
            value={node.data.title}
            onChange={(e) => updateStep(node.id, { title: e.target.value })}
            placeholder="ステップ名"
            className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm font-semibold outline-none focus:border-violet-500 dark:border-neutral-600 dark:bg-neutral-800"
          />
        ) : (
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {node.data.title}
          </h3>
        )}
      </div>

      {isEdit && (
        <div className="flex gap-1 px-3">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`rounded-t px-3 py-1 text-xs ${
              tab === 'edit'
                ? 'bg-violet-100 font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`rounded-t px-3 py-1 text-xs ${
              tab === 'preview'
                ? 'bg-violet-100 font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
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
            className="h-full w-full resize-none rounded border border-neutral-300 p-2 font-mono text-xs leading-relaxed outline-none focus:border-violet-500 dark:border-neutral-600 dark:bg-neutral-800"
          />
        ) : node.data.manual ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{node.data.manual}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm italic text-neutral-400">まだマニュアルが書かれていません。</p>
        )}
      </div>
    </div>
  )
}
