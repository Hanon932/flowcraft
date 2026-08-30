import { useMemo } from 'react'
import ReactFlow, { type Node, type NodeTypes } from 'reactflow'
import 'reactflow/dist/style.css'
import { useFlowStore } from '../store'
import ExportImagePanel from './ExportImagePanel'
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
  const deleteStep = useFlowStore((s) => s.deleteStep)

  const nodes = useMemo<Node[]>(
    () => doc.nodes.map((n) => ({ ...n, selected: n.id === selectedNodeId })),
    [doc.nodes, selectedNodeId],
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    if (e.key !== 'Delete' && e.key !== 'Backspace') return
    if (mode !== 'edit' || !selectedNodeId) return
    e.preventDefault()
    deleteStep(selectedNodeId)
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
        defaultEdgeOptions={{ style: { stroke: '#93c5fd', strokeWidth: 1.5 } }}
        fitView
      >
        <ExportImagePanel nodes={nodes} fileBaseName={doc.name} />
      </ReactFlow>
    </div>
  )
}
