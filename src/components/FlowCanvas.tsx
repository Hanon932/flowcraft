import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactFlow, {
  ConnectionMode,
  type Edge,
  type Node,
  type NodeTypes,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useClickOutside } from '../lib/useClickOutside'
import { useFlowStore } from '../store'
import ExportImagePanel from './ExportImagePanel'
import StepNode from './StepNode'
import StickyNoteNode from './StickyNoteNode'

const nodeTypes: NodeTypes = { step: StepNode, note: StickyNoteNode }

export default function FlowCanvas() {
  const doc = useFlowStore((s) => s.activeDoc())
  const mode = useFlowStore((s) => s.mode)
  const onNodesChange = useFlowStore((s) => s.onNodesChange)
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange)
  const onConnect = useFlowStore((s) => s.onConnect)
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId)
  const setSelectedEdgeId = useFlowStore((s) => s.setSelectedEdgeId)
  const addStickyNote = useFlowStore((s) => s.addStickyNote)
  const addStep = useFlowStore((s) => s.addStep)

  const rfInstance = useRef<ReactFlowInstance | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    screenX: number
    screenY: number
    flowX: number
    flowY: number
  } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  useClickOutside(Boolean(contextMenu), () => setContextMenu(null), [contextMenuRef])

  // Selection state (including which node/edge is "selected" for the side
  // panel and keyboard shortcuts) lives on the nodes/edges themselves via
  // React Flow's own onNodesChange/onEdgesChange, so a rubber-band drag can
  // mark several nodes selected at once and drag them together. We only
  // mirror a single selected id into the store when exactly one element is
  // selected, for the manual panel / F2 / Delete / copy-paste shortcuts.
  const handleSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: OnSelectionChangeParams) => {
      setSelectedNodeId(selNodes.length === 1 ? selNodes[0].id : null)
      setSelectedEdgeId(selEdges.length === 1 ? selEdges[0].id : null)
    },
    [setSelectedNodeId, setSelectedEdgeId],
  )

  function handlePaneContextMenu(e: React.MouseEvent | MouseEvent) {
    e.preventDefault()
    if (mode !== 'edit') return
    const flowPos = rfInstance.current?.screenToFlowPosition({ x: e.clientX, y: e.clientY }) ?? {
      x: 0,
      y: 0,
    }
    setContextMenu({ screenX: e.clientX, screenY: e.clientY, flowX: flowPos.x, flowY: flowPos.y })
  }

  return (
    <div className="h-full w-full bg-[#f5f5f7]">
      <ReactFlow
        nodes={doc.nodes as Node[]}
        edges={doc.edges as Edge[]}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        onInit={(instance) => {
          rfInstance.current = instance
        }}
        onNodesChange={mode === 'edit' ? onNodesChange : undefined}
        onEdgesChange={mode === 'edit' ? onEdgesChange : undefined}
        onConnect={mode === 'edit' ? onConnect : undefined}
        onSelectionChange={handleSelectionChange}
        nodesDraggable={mode === 'edit'}
        nodesConnectable={mode === 'edit'}
        elementsSelectable
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        onPaneClick={() => setContextMenu(null)}
        onPaneContextMenu={handlePaneContextMenu}
        defaultEdgeOptions={{ style: { stroke: '#a1a1a6', strokeWidth: 1.5 } }}
        fitView
      >
        <ExportImagePanel nodes={doc.nodes as Node[]} fileBaseName={doc.name} />
      </ReactFlow>

      {contextMenu &&
        createPortal(
          <div
            ref={contextMenuRef}
            style={{ position: 'fixed', top: contextMenu.screenY, left: contextMenu.screenX, zIndex: 9999 }}
            className="w-44 rounded-xl bg-white p-1 shadow-lg ring-1 ring-[#d2d2d7]"
          >
            <button
              type="button"
              onClick={() => {
                addStep({ x: contextMenu.flowX, y: contextMenu.flowY })
                setContextMenu(null)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[#1d1d1f] hover:bg-[#0071e3]/10"
            >
              <span>▭</span>
              <span>ステップを追加</span>
            </button>
            <button
              type="button"
              onClick={() => {
                addStickyNote({ x: contextMenu.flowX, y: contextMenu.flowY })
                setContextMenu(null)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[#1d1d1f] hover:bg-[#0071e3]/10"
            >
              <span>🗒️</span>
              <span>付箋を追加</span>
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
