import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactFlow, { Panel, type Node, type NodeTypes, type ReactFlowInstance } from 'reactflow'
import 'reactflow/dist/style.css'
import { computeCollapseVisibility } from '../lib/mindmapLayout'
import { useClickOutside } from '../lib/useClickOutside'
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
  const addMindMapRoot = useFlowStore((s) => s.addMindMapRoot)
  const deleteStep = useFlowStore((s) => s.deleteStep)
  const requestEditNode = useFlowStore((s) => s.requestEditNode)

  const rfInstance = useRef<ReactFlowInstance | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    screenX: number
    screenY: number
    flowX: number
    flowY: number
  } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  useClickOutside(Boolean(contextMenu), () => setContextMenu(null), [contextMenuRef])

  const { hiddenIds, childCounts, descendantCounts } = useMemo(
    () => computeCollapseVisibility(doc.nodes, doc.edges),
    [doc.nodes, doc.edges],
  )

  const milestoneStats = useMemo(() => {
    const milestones = doc.nodes.filter((n) => !(n.data as MindMapNodeData).root)
    const done = milestones.filter((n) => (n.data as MindMapNodeData).status === 'done').length
    return { done, total: milestones.length }
  }, [doc.nodes])

  const nodes = useMemo<Node[]>(
    () =>
      doc.nodes
        .filter((n) => !hiddenIds.has(n.id))
        .map((n) => ({
          ...n,
          selected: n.id === selectedNodeId,
          data: {
            ...n.data,
            hasChildren: (childCounts.get(n.id) ?? 0) > 0,
            hiddenCount: descendantCounts.get(n.id) ?? 0,
            ...((n.data as MindMapNodeData).root
              ? { progressDone: milestoneStats.done, progressTotal: milestoneStats.total }
              : {}),
          },
        })),
    [doc.nodes, selectedNodeId, hiddenIds, childCounts, descendantCounts, milestoneStats],
  )

  const edges = useMemo(
    () => doc.edges.filter((e) => !hiddenIds.has(e.source) && !hiddenIds.has(e.target)),
    [doc.edges, hiddenIds],
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

    if (e.key === 'F2') {
      e.preventDefault()
      requestEditNode(selectedNodeId)
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

  function handlePaneContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    if (mode !== 'edit') return
    const flowPos = rfInstance.current?.screenToFlowPosition({ x: e.clientX, y: e.clientY }) ?? {
      x: 0,
      y: 0,
    }
    setContextMenu({ screenX: e.clientX, screenY: e.clientY, flowX: flowPos.x, flowY: flowPos.y })
  }

  return (
    <div className="h-full w-full bg-[#f5f5f7]" onKeyDown={handleKeyDown}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          rfInstance.current = instance
        }}
        onNodesChange={mode === 'edit' ? onNodesChange : undefined}
        onEdgesChange={mode === 'edit' ? onEdgesChange : undefined}
        onConnect={mode === 'edit' ? onConnect : undefined}
        nodesDraggable={mode === 'edit'}
        nodesConnectable={mode === 'edit'}
        elementsSelectable
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => {
          setSelectedNodeId(null)
          setContextMenu(null)
        }}
        onPaneContextMenu={handlePaneContextMenu}
        fitView
      >
        {mode === 'edit' && (
          <Panel position="top-left">
            <div className="rounded-full bg-white/90 px-3 py-1 text-xs text-[#86868b] shadow-sm ring-1 ring-[#d2d2d7] backdrop-blur">
              Tab キーで子トピック追加・F2キーで編集・Delete キーで削除・右クリックで中心テーマ追加
            </div>
          </Panel>
        )}
        <ExportImagePanel nodes={nodes} fileBaseName={doc.name} />
      </ReactFlow>

      {contextMenu &&
        createPortal(
          <div
            ref={contextMenuRef}
            style={{ position: 'fixed', top: contextMenu.screenY, left: contextMenu.screenX, zIndex: 9999 }}
            className="w-48 rounded-xl bg-white p-1 shadow-lg ring-1 ring-[#d2d2d7]"
          >
            <button
              type="button"
              onClick={() => {
                addMindMapRoot({ x: contextMenu.flowX, y: contextMenu.flowY })
                setContextMenu(null)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[#1d1d1f] hover:bg-[#0071e3]/10"
            >
              <span>◎</span>
              <span>中心テーマを作成</span>
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
