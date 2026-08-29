import { useRef } from 'react'
import { useFlowStore } from '../store'
import type { FlowDoc } from '../types'

export default function Toolbar() {
  const doc = useFlowStore((s) => s.activeDoc())
  const mode = useFlowStore((s) => s.mode)
  const setMode = useFlowStore((s) => s.setMode)
  const renameFlow = useFlowStore((s) => s.renameFlow)
  const addStep = useFlowStore((s) => s.addStep)
  const importDoc = useFlowStore((s) => s.importDoc)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.name || 'flow'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as FlowDoc
      if (!parsed.nodes || !parsed.edges) throw new Error('invalid')
      importDoc({ ...parsed, id: `${parsed.id}-${Date.now()}` })
    } catch {
      alert('フローファイルの読み込みに失敗しました。')
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
      <input
        value={doc.name}
        onChange={(e) => renameFlow(doc.id, e.target.value)}
        disabled={mode !== 'edit'}
        className="w-56 rounded px-2 py-1 text-sm font-semibold outline-none focus:bg-neutral-100 disabled:bg-transparent dark:focus:bg-neutral-800"
      />

      <div className="flex items-center gap-2">
        {mode === 'edit' && (
          <button
            type="button"
            onClick={addStep}
            className="rounded bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
          >
            ＋ ステップ追加
          </button>
        )}

        <div className="flex overflow-hidden rounded border border-neutral-300 text-xs dark:border-neutral-600">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`px-3 py-1.5 ${
              mode === 'edit'
                ? 'bg-violet-600 text-white'
                : 'bg-white text-neutral-500 dark:bg-neutral-800'
            }`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setMode('view')}
            className={`px-3 py-1.5 ${
              mode === 'view'
                ? 'bg-violet-600 text-white'
                : 'bg-white text-neutral-500 dark:bg-neutral-800'
            }`}
          >
            閲覧
          </button>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          エクスポート
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          インポート
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
