import { useRef } from 'react'
import { redo, undo, useUndoStatus } from '../history'
import { useFlowStore } from '../store'
import type { FlowDoc, FreeShape } from '../types'
import GoogleDriveMenu from './GoogleDriveMenu'
import MindMapLayoutMenu from './MindMapLayoutMenu'

const FREE_SHAPES: { key: FreeShape; icon: string; label: string }[] = [
  { key: 'rectangle', icon: '▭', label: '四角形を追加' },
  { key: 'oval', icon: '◖◗', label: '角丸を追加' },
  { key: 'diamond', icon: '◇', label: 'ひし形を追加' },
  { key: 'parallelogram', icon: '▱', label: '平行四辺形を追加' },
]

export default function Toolbar() {
  const doc = useFlowStore((s) => s.activeDoc())
  const mode = useFlowStore((s) => s.mode)
  const setMode = useFlowStore((s) => s.setMode)
  const renameFlow = useFlowStore((s) => s.renameFlow)
  const addStep = useFlowStore((s) => s.addStep)
  const applyFlowchartLayout = useFlowStore((s) => s.applyFlowchartLayout)
  const addFreeShape = useFlowStore((s) => s.addFreeShape)
  const importDoc = useFlowStore((s) => s.importDoc)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const kind = doc.kind ?? 'flowchart'
  const { canUndo, canRedo } = useUndoStatus()

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
    <div className="flex items-center justify-between border-b border-[#d2d2d7] bg-white/80 px-5 py-2.5 backdrop-blur-md">
      <input
        value={doc.name}
        onChange={(e) => renameFlow(doc.id, e.target.value)}
        disabled={mode !== 'edit'}
        className="w-56 rounded-lg px-2 py-1 text-sm font-semibold tracking-tight text-[#1d1d1f] outline-none focus:bg-[#0071e3]/10 disabled:bg-transparent"
      />

      <div className="flex items-center gap-1.5">
        {mode === 'edit' && kind === 'flowchart' && (
          <>
            <button
              type="button"
              onClick={addStep}
              className="rounded-full bg-[#0071e3] px-4 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-[#0077ed]"
            >
              ＋ ステップ追加
            </button>
            <button
              type="button"
              onClick={applyFlowchartLayout}
              title="ステップを上から順に綺麗に並べ直します"
              className="rounded-full px-3 py-1.5 text-xs text-[#86868b] transition-colors duration-200 hover:bg-black/[0.03]"
            >
              自動整列
            </button>
          </>
        )}

        {mode === 'edit' && kind === 'mindmap' && <MindMapLayoutMenu />}

        {mode === 'edit' && kind === 'freeform' && (
          <div className="flex gap-1 rounded-full bg-[#f5f5f7] p-0.5">
            {FREE_SHAPES.map((s) => (
              <button
                key={s.key}
                type="button"
                title={s.label}
                onClick={() => addFreeShape(s.key)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-[#86868b] transition-colors duration-200 hover:bg-white hover:text-[#0071e3] hover:shadow-sm"
              >
                {s.icon}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="元に戻す（Ctrl+Z）"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#86868b] transition-colors duration-200 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:text-[#d2d2d7] disabled:hover:bg-transparent"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="やり直す（Ctrl+Shift+Z）"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#86868b] transition-colors duration-200 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:text-[#d2d2d7] disabled:hover:bg-transparent"
          >
            ↷
          </button>
        </div>

        <div className="flex rounded-full bg-[#f5f5f7] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`rounded-full px-3 py-1 transition-colors duration-200 ${
              mode === 'edit'
                ? 'bg-white text-[#0071e3] shadow-sm'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setMode('view')}
            className={`rounded-full px-3 py-1 transition-colors duration-200 ${
              mode === 'view'
                ? 'bg-white text-[#0071e3] shadow-sm'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            閲覧
          </button>
        </div>

        <div className="mx-1 h-5 w-px bg-[#d2d2d7]" />

        <GoogleDriveMenu />

        <button
          type="button"
          onClick={handleExport}
          className="rounded-full px-3 py-1.5 text-xs text-[#86868b] transition-colors duration-200 hover:bg-black/[0.03]"
        >
          エクスポート
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="rounded-full px-3 py-1.5 text-xs text-[#86868b] transition-colors duration-200 hover:bg-black/[0.03]"
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
