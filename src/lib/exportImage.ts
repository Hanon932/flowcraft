import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'
import { getNodesBounds, getViewportForBounds, type Node } from 'reactflow'

const PADDING = 40
const MIN_ZOOM = 0.2
const MAX_ZOOM = 2

async function flowToPngDataUrl(nodes: Node[]): Promise<{ dataUrl: string; width: number; height: number }> {
  const viewportEl = document.querySelector<HTMLElement>('.react-flow__viewport')
  if (!viewportEl) throw new Error('React Flow のビューポートが見つかりません')

  const bounds = getNodesBounds(nodes)
  const width = Math.max(1, Math.ceil(bounds.width)) + PADDING * 2
  const height = Math.max(1, Math.ceil(bounds.height)) + PADDING * 2
  const viewport = getViewportForBounds(bounds, width, height, MIN_ZOOM, MAX_ZOOM, PADDING)

  const dataUrl = await toPng(viewportEl, {
    backgroundColor: '#ffffff',
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  })

  return { dataUrl, width, height }
}

export async function flowToPngBlob(nodes: Node[]): Promise<Blob> {
  const { dataUrl } = await flowToPngDataUrl(nodes)
  const res = await fetch(dataUrl)
  return res.blob()
}

export async function flowToPdfBlob(nodes: Node[]): Promise<Blob> {
  const { dataUrl, width, height } = await flowToPngDataUrl(nodes)

  const pdf = new jsPDF({
    orientation: width >= height ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [width, height],
  })
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height)
  return pdf.output('blob')
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function copyBlobToClipboard(blob: Blob) {
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
}
