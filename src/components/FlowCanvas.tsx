import { useMemo } from 'react'
import ReactFlow, { ConnectionMode, type Edge, type Node, type NodeTypes } from 'reactflow'
import 'reactflow/dist/style.css'
import { useFlowStore } from '../store'
import ExportImagePanel from './ExportImagePanel'
import StepNode from './StepNode'

const nodeTypes: NodeTypes = { step: StepNode }

export default function FlowCanvas() {
  const doc = useFlowStore((s) => s.activeDoc())
  const mode = useFlowStore((s) => s.mode)
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId)
  const selectedEdgeId = useFlowStore((s) => s.selectedEdgeId)
  const onNodesChange = useFlowStore((s) => s.onNodesChange)
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange)
  const onConnect = useFlowStore((s) => s.onConnect)
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId)
  const setSelectedEdgeId = useFlowStore((s) => s.setSelectedEdgeId)
  const nodes = useMemo<Node[]>(
    () => doc.nodes.map((n) => ({ ...n, selected: n.id === selectedNodeId })),
    [doc.nodes, selectedNodeId],
  )

  const edges = useMemo<Edge[]>(
    () => doc.edges.map((e) => ({ ...e, selected: e.id === selectedEdgeId })),
    [doc.edges, selectedEdgeId],
  )

  return (
    <div className="h-full w-full bg-[#f5f5f7]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        onNodesChange={mode === 'edit' ? onNodesChange : undefined}
        onEdgesChange={mode === 'edit' ? onEdgesChange : undefined}
        onConnect={mode === 'edit' ? onConnect : undefined}
        nodesDraggable={mode === 'edit'}
        nodesConnectable={mode === 'edit'}
        elementsSelectable
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id)
          setSelectedEdgeId(null)
        }}
        onEdgeClick={(e, edge) => {
          e.stopPropagation()
          setSelectedEdgeId(edge.id)
          setSelectedNodeId(null)
        }}
        onPaneClick={() => {
          setSelectedNodeId(null)
          setSelectedEdgeId(null)
        }}
        defaultEdgeOptions={{ style: { stroke: '#a1a1a6', strokeWidth: 1.5 } }}
        fitView
      >
        <ExportImagePanel nodes={nodes} fileBaseName={doc.name} />
      </ReactFlow>
    </div>
  )
}
