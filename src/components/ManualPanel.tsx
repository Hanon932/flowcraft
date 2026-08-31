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
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#86868b]">
        図形をクリックすると、
        <br />
        ステップのマニュアルがここに表示されます。
      </div>
    )
  }

  const isEdit = mode === 'edit'

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-[#d2d2d7] p-3">
        <span className="text-xs font-medium text-[#86868b]">ステップの詳細</span>
        <div className="flex items-center gap-1">
          {isEdit && (
            <button
              type="button"
              onClick={() => deleteStep(node.id)}
              className="rounded-full px-2.5 py-1 text-xs text-[#ff3b30] hover:bg-[#ff3b30]/10"
            >
              削除
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelectedNodeId(null)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.03]"
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
            className="w-full rounded-xl bg-[#f5f5f7] px-3 py-2 text-sm font-semibold text-[#1d1d1f] outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
          />
        ) : (
          <h3 className="text-sm font-semibold tracking-tight text-[#1d1d1f]">
            {node.data.title}
          </h3>
        )}
      </div>

      {isEdit && (
        <div className="flex gap-1 px-3">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`rounded-full px-3 py-1 text-xs transition-colors duration-200 ${
              tab === 'edit'
                ? 'bg-[#0071e3]/10 font-medium text-[#0071e3]'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`rounded-full px-3 py-1 text-xs transition-colors duration-200 ${
              tab === 'preview'
                ? 'bg-[#0071e3]/10 font-medium text-[#0071e3]'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
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
            className="h-full w-full resize-none rounded-xl bg-[#f5f5f7] p-3 font-mono text-xs leading-relaxed text-[#1d1d1f] outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
          />
        ) : node.data.manual ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{node.data.manual}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm italic text-[#86868b]">まだマニュアルが書かれていません。</p>
        )}
      </div>
    </div>
  )
}
