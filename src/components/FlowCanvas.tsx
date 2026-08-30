import { useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { copyBlobToClipboard, downloadBlob, flowToPngBlob } from '../lib/exportImage'
import { useFlowStore } from '../store'
import StepNode from './StepNode'

const nodeTypes: NodeTypes = { step: StepNode }

export default function FlowCanvas() {
  const doc = useFlowStore((s) => s.activeDoc())
  const mode = useFlowStore((s) => s.mode)
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId)
  const onNodesChange = useFlowStore((s) => s.onNodesChange)
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange)
  const onConnect = useFlowStore((s) => s.onConnect)
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId)
  const [imageStatus, setImageStatus] = useState<string | null>(null)

  const nodes = useMemo<Node[]>(
    () => doc.nodes.map((n) => ({ ...n, selected: n.id === selectedNodeId })),
    [doc.nodes, selectedNodeId],
  )

  async function handleCopyImage() {
    setImageStatus('画像を生成中…')
    try {
      const blob = await flowToPngBlob(nodes)
      await copyBlobToClipboard(blob)
      setImageStatus('コピーしました。Excelなどに Ctrl+V で貼り付けできます')
    } catch (err) {
      console.error(err)
      setImageStatus('コピーに失敗しました（ブラウザがクリップボード画像に未対応の可能性）')
    } finally {
      setTimeout(() => setImageStatus(null), 3500)
    }
  }

  async function handleDownloadImage() {
    setImageStatus('画像を生成中…')
    try {
      const blob = await flowToPngBlob(nodes)
      downloadBlob(blob, `${doc.name || 'flow'}.png`)
      setImageStatus('画像を保存しました')
    } catch (err) {
      console.error(err)
      setImageStatus('画像の生成に失敗しました')
    } finally {
      setTimeout(() => setImageStatus(null), 3500)
    }
  }

  return (
    <div className="h-full w-full bg-neutral-50 dark:bg-neutral-950">
      <ReactFlow
        nodes={nodes}
        edges={doc.edges}
        nodeTypes={nodeTypes}
        onNodesChange={mode === 'edit' ? onNodesChange : undefined}
        onEdgesChange={mode === 'edit' ? onEdgesChange : undefined}
        onConnect={mode === 'edit' ? onConnect : undefined}
        nodesDraggable={mode === 'edit'}
        nodesConnectable={mode === 'edit'}
        elementsSelectable
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        defaultEdgeOptions={{ style: { stroke: '#93c5fd', strokeWidth: 1.5 } }}
        fitView
      >
        <Background gap={20} color="#dbeafe" />
        <Controls className="!rounded-xl !shadow-md" showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          className="!hidden !rounded-xl !shadow-md sm:!block"
          maskColor="rgba(226, 232, 240, 0.6)"
        />
        <Panel position="top-right" className="flex flex-col items-end gap-1.5">
          <div className="flex gap-1.5 rounded-full bg-white/90 p-1 shadow-md ring-1 ring-neutral-100 backdrop-blur dark:bg-neutral-800/90 dark:ring-neutral-700">
            <button
              type="button"
              onClick={handleCopyImage}
              title="画像としてクリップボードにコピー（Excelなどに貼り付け可）"
              className="rounded-full px-3 py-1 text-xs text-neutral-500 hover:bg-sky-50 hover:text-sky-600 dark:text-neutral-300"
            >
              画像をコピー
            </button>
            <button
              type="button"
              onClick={handleDownloadImage}
              title="PNG画像として保存"
              className="rounded-full px-3 py-1 text-xs text-neutral-500 hover:bg-sky-50 hover:text-sky-600 dark:text-neutral-300"
            >
              画像を保存
            </button>
          </div>
          {imageStatus && (
            <div className="rounded-full bg-neutral-800/90 px-3 py-1 text-xs text-white shadow-md">
              {imageStatus}
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  )
}
