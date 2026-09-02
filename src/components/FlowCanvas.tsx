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

const EDGE_STYLE_OPTIONS: { type: string | undefined; label: string; icon: string }[] = [
  { type: undefined, label: 'カーブ', icon: '〜' },
  { type: 'straight', label: '直線', icon: '─' },
  { type: 'step', label: 'カクカク', icon: '⌐' },
  { type: 'smoothstep', label: '滑らかカクカク', icon: '⌐' },
]

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
  const updateEdgeLabel = useFlowStore((s) => s.updateEdgeLabel)
  const updateEdgeType = useFlowStore((s) => s.updateEdgeType)

  const rfInstance = useRef<ReactFlowInstance | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    screenX: number
    screenY: number
    flowX: number
    flowY: number
  } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  useClickOutside(Boolean(contextMenu), () => setContextMenu(null), [contextMenuRef])

  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    edgeId: string
    screenX: number
    screenY: number
  } | null>(null)
  const edgeContextMenuRef = useRef<HTMLDivElement>(null)
  useClickOutside(Boolean(edgeContextMenu), () => setEdgeContextMenu(null), [edgeContextMenuRef])

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

  function handleEdgeContextMenu(e: React.MouseEvent, edge: Edge) {
    e.preventDefault()
    if (mode !== 'edit') return
    setEdgeContextMenu({ edgeId: edge.id, screenX: e.clientX, screenY: e.clientY })
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
        onPaneClick={() => {
          setContextMenu(null)
          setEdgeContextMenu(null)
        }}
        onPaneContextMenu={handlePaneContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        defaultEdgeOptions={{
          style: { stroke: '#a1a1a6', strokeWidth: 1.5 },
          labelStyle: { fill: '#1d1d1f', fontWeight: 600, fontSize: 12 },
          labelBgStyle: { fill: '#ffffff' },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 6,
        }}
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

      {edgeContextMenu &&
        createPortal(
          <div
            ref={edgeContextMenuRef}
            style={{
              position: 'fixed',
              top: edgeContextMenu.screenY,
              left: edgeContextMenu.screenX,
              zIndex: 9999,
            }}
            className="w-36 rounded-xl bg-white p-1 shadow-lg ring-1 ring-[#d2d2d7]"
          >
            <div className="px-2 py-1 text-[10px] font-medium text-[#86868b]">ラベルを設定</div>
            {['Yes', 'No'].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  updateEdgeLabel(edgeContextMenu.edgeId, label)
                  setEdgeContextMenu(null)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs text-[#1d1d1f] hover:bg-[#0071e3]/10"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                updateEdgeLabel(edgeContextMenu.edgeId, undefined)
                setEdgeContextMenu(null)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs text-[#86868b] hover:bg-[#0071e3]/10"
            >
              ラベルを削除
            </button>

            <div className="mt-1 border-t border-[#d2d2d7] pt-1">
              <div className="px-2 py-1 text-[10px] font-medium text-[#86868b]">線のスタイル</div>
              {EDGE_STYLE_OPTIONS.map((opt) => {
                const currentType = doc.edges.find((e) => e.id === edgeContextMenu.edgeId)?.type
                const isActive = (currentType ?? undefined) === opt.type
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      updateEdgeType(edgeContextMenu.edgeId, opt.type)
                      setEdgeContextMenu(null)
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs hover:bg-[#0071e3]/10 ${
                      isActive ? 'text-[#0071e3]' : 'text-[#1d1d1f]'
                    }`}
                  >
                    <span className="w-3 text-center">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
