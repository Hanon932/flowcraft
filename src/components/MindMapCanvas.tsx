import { useMemo } from 'react'
import ReactFlow, { Panel, type Node, type NodeTypes } from 'reactflow'
import 'reactflow/dist/style.css'
import { useFlowStore } from '../store'
import type { MindMapNodeData } from '../types'
import ExportImagePanel from './ExportImagePanel'
import TopicNode from './TopicNode'

const nodeTypes: NodeTypes = { topic: TopicNode }

export default function MindMapCanvas() {
  const doc = useFlowStore((s) => s.activeDoc())
  const mode = useFlowStore((s) => s.mode)
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId)
  const onNodesChange = useFlowStore((s) => s.onNodesChange)
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange)
  const onConnect = useFlowStore((s) => s.onConnect)
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId)
  const addMindMapChild = useFlowStore((s) => s.addMindMapChild)
  const deleteStep = useFlowStore((s) => s.deleteStep)

  const nodes = useMemo<Node[]>(
    () => doc.nodes.map((n) => ({ ...n, selected: n.id === selectedNodeId })),
    [doc.nodes, selectedNodeId],
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (mode !== 'edit' || !selectedNodeId) return
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

    if (e.key === 'Tab') {
      e.preventDefault()
      addMindMapChild(selectedNodeId)
      return
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const node = doc.nodes.find((n) => n.id === selectedNodeId)
      const isRoot = Boolean((node?.data as MindMapNodeData | undefined)?.root)
      if (isRoot) return
      e.preventDefault()
      deleteStep(selectedNodeId)
    }
  }

  return (
    <div className="h-full w-full bg-neutral-50" onKeyDown={handleKeyDown}>
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
        fitView
      >
        {mode === 'edit' && (
          <Panel position="top-left">
            <div className="rounded-full bg-white/90 px-3 py-1 text-xs text-neutral-400 shadow-sm ring-1 ring-neutral-100 backdrop-blur">
              トピックを選んで Tab キーで子トピックを追加・Delete キーで削除・ダブルクリックで編集
            </div>
          </Panel>
        )}
        <ExportImagePanel nodes={nodes} fileBaseName={doc.name} />
      </ReactFlow>
    </div>
  )
}
