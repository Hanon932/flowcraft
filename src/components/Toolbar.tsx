import { useRef } from 'react'
import { useFlowStore } from '../store'
import type { FlowDoc } from '../types'
import GoogleDriveMenu from './GoogleDriveMenu'

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
    <div className="flex items-center justify-between border-b border-neutral-100 bg-white px-5 py-2.5">
      <input
        value={doc.name}
        onChange={(e) => renameFlow(doc.id, e.target.value)}
        disabled={mode !== 'edit'}
        className="w-56 rounded-lg px-2 py-1 text-sm font-semibold text-neutral-800 outline-none focus:bg-sky-50 disabled:bg-transparent"
      />

      <div className="flex items-center gap-1.5">
        {mode === 'edit' && (
          <button
            type="button"
            onClick={addStep}
            className="rounded-full bg-sky-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm shadow-sky-200 hover:bg-sky-600"
          >
            ＋ ステップ追加
          </button>
        )}

        <div className="flex rounded-full bg-neutral-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`rounded-full px-3 py-1 transition-colors ${
              mode === 'edit'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setMode('view')}
            className={`rounded-full px-3 py-1 transition-colors ${
              mode === 'view'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            閲覧
          </button>
        </div>

        <div className="mx-1 h-5 w-px bg-neutral-200" />

        <GoogleDriveMenu />

        <button
          type="button"
          onClick={handleExport}
          className="rounded-full px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
        >
          エクスポート
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="rounded-full px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
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
