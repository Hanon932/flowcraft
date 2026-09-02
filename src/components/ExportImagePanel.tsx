import { useState } from 'react'
import { Panel, type Node } from 'reactflow'
import { copyBlobToClipboard, downloadBlob, flowToPdfBlob, flowToPngBlob } from '../lib/exportImage'

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

  async function handleDownloadPdf() {
    setStatus('PDFを生成中…')
    try {
      const blob = await flowToPdfBlob(nodes)
      downloadBlob(blob, `${fileBaseName || 'flow'}.pdf`)
      setStatus('PDFを保存しました')
    } catch (err) {
      console.error(err)
      setStatus('PDFの生成に失敗しました')
    } finally {
      setTimeout(() => setStatus(null), 3500)
    }
  }

  return (
    <Panel position="top-right" className="flex flex-col items-end gap-1.5">
      <div className="flex gap-1.5 rounded-full bg-white/90 p-1 shadow-md ring-1 ring-[#d2d2d7] backdrop-blur">
        <button
          type="button"
          onClick={handleCopyImage}
          title="画像としてクリップボードにコピー（Excelなどに貼り付け可）"
          className="rounded-full px-3 py-1 text-xs text-[#86868b] hover:bg-[#0071e3]/10 hover:text-[#0071e3]"
        >
          画像をコピー
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          title="PDFとして保存"
          className="rounded-full px-3 py-1 text-xs text-[#86868b] hover:bg-[#0071e3]/10 hover:text-[#0071e3]"
        >
          PDFを保存
        </button>
      </div>
      {status && (
        <div className="rounded-full bg-[#1d1d1f]/95 px-3 py-1 text-xs text-white shadow-md">
          {status}
        </div>
      )}
    </Panel>
  )
}
