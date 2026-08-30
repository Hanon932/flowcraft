import { useState } from 'react'
import { Panel, type Node } from 'reactflow'
import { copyBlobToClipboard, downloadBlob, flowToPngBlob } from '../lib/exportImage'

export default function ExportImagePanel({
  nodes,
  fileBaseName,
}: {
  nodes: Node[]
  fileBaseName: string
}) {
  const [status, setStatus] = useState<string | null>(null)

  async function handleCopyImage() {
    setStatus('画像を生成中…')
    try {
      const blob = await flowToPngBlob(nodes)
      await copyBlobToClipboard(blob)
      setStatus('コピーしました。Excelなどに Ctrl+V で貼り付けできます')
    } catch (err) {
      console.error(err)
      setStatus('コピーに失敗しました（ブラウザがクリップボード画像に未対応の可能性）')
    } finally {
      setTimeout(() => setStatus(null), 3500)
    }
  }

  async function handleDownloadImage() {
    setStatus('画像を生成中…')
    try {
      const blob = await flowToPngBlob(nodes)
      downloadBlob(blob, `${fileBaseName || 'flow'}.png`)
      setStatus('画像を保存しました')
    } catch (err) {
      console.error(err)
      setStatus('画像の生成に失敗しました')
    } finally {
      setTimeout(() => setStatus(null), 3500)
    }
  }

  return (
    <Panel position="top-right" className="flex flex-col items-end gap-1.5">
      <div className="flex gap-1.5 rounded-full bg-white/90 p-1 shadow-md ring-1 ring-neutral-100 backdrop-blur">
        <button
          type="button"
          onClick={handleCopyImage}
          title="画像としてクリップボードにコピー（Excelなどに貼り付け可）"
          className="rounded-full px-3 py-1 text-xs text-neutral-500 hover:bg-sky-50 hover:text-sky-600"
        >
          画像をコピー
        </button>
        <button
          type="button"
          onClick={handleDownloadImage}
          title="PNG画像として保存"
          className="rounded-full px-3 py-1 text-xs text-neutral-500 hover:bg-sky-50 hover:text-sky-600"
        >
          画像を保存
        </button>
      </div>
      {status && (
        <div className="rounded-full bg-neutral-800/90 px-3 py-1 text-xs text-white shadow-md">
          {status}
        </div>
      )}
    </Panel>
  )
}
