import { nanoid } from 'nanoid'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type Node,
  type NodeChange,
} from 'reactflow'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnyStepNode, DocKind, FlowDoc, MindMapNodeData, StepData } from './types'

const BRANCH_COLORS = [
  '#0ea5e9',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#ec4899',
]

function createDoc(name: string, kind: DocKind = 'flowchart'): FlowDoc {
  if (kind === 'mindmap') {
    return {
      id: nanoid(8),
      name,
      kind: 'mindmap',
      nodes: [
        {
          id: nanoid(6),
          type: 'topic',
          position: { x: 400, y: 300 },
          data: { text: '中心テーマ', root: true },
        },
      ],
      edges: [],
      updatedAt: Date.now(),
    }
  }
  return {
    id: nanoid(8),
    name,
    kind: 'flowchart',
    nodes: [
      {
        id: nanoid(6),
        type: 'step',
        position: { x: 250, y: 60 },
        data: { title: '開始', manual: 'ここに最初の手順を書きましょう。' },
      },
    ],
    edges: [],
    updatedAt: Date.now(),
  }
}

interface FlowStore {
  docs: FlowDoc[]
  activeId: string
  selectedNodeId: string | null
  mode: 'edit' | 'view'

  activeDoc: () => FlowDoc
  selectedNode: () => FlowDoc['nodes'][number] | undefined

  setActiveId: (id: string) => void
  setMode: (mode: 'edit' | 'view') => void
  setSelectedNodeId: (id: string | null) => void

  createFlow: (kind: DocKind) => void
  renameFlow: (id: string, name: string) => void
  deleteFlow: (id: string) => void

  addStep: () => void
  addConnectedStep: (sourceId: string) => void
  addMindMapChild: (parentId: string) => void
  updateStep: (nodeId: string, data: Partial<StepData>) => void
  deleteStep: (nodeId: string) => void

  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  importDoc: (doc: FlowDoc) => void
  importFromDrive: (doc: FlowDoc, driveFileId: string) => void
  setDriveFileId: (docId: string, driveFileId: string) => void
}

const initialDoc = createDoc('サンプルフロー')

export const useFlowStore = create<FlowStore>()(
  persist(
    (set, get) => ({
      docs: [initialDoc],
      activeId: initialDoc.id,
      selectedNodeId: null,
      mode: 'edit',

      activeDoc: () => {
        const { docs, activeId } = get()
        return docs.find((d) => d.id === activeId) ?? docs[0]
      },
      selectedNode: () => {
        const { selectedNodeId } = get()
        if (!selectedNodeId) return undefined
        return get()
          .activeDoc()
          .nodes.find((n) => n.id === selectedNodeId)
      },

      setActiveId: (id) => set({ activeId: id, selectedNodeId: null }),
      setMode: (mode) => set({ mode, selectedNodeId: null }),
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),

      createFlow: (kind) => {
        const countOfKind = get().docs.filter((d) => (d.kind ?? 'flowchart') === kind).length
        const label = kind === 'mindmap' ? 'マインドマップ' : '新しいフロー'
        const doc = createDoc(`${label} ${countOfKind + 1}`, kind)
        set((s) => ({ docs: [...s.docs, doc], activeId: doc.id, selectedNodeId: null }))
      },
      renameFlow: (id, name) => {
        set((s) => ({
          docs: s.docs.map((d) => (d.id === id ? { ...d, name, updatedAt: Date.now() } : d)),
        }))
      },
      deleteFlow: (id) => {
        set((s) => {
          const remaining = s.docs.filter((d) => d.id !== id)
          const docs = remaining.length ? remaining : [createDoc('新しいフロー')]
          const activeId = s.activeId === id ? docs[0].id : s.activeId
          return { docs, activeId, selectedNodeId: null }
        })
      },

      addStep: () => {
        const id = nanoid(6)
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: [
                    ...d.nodes,
                    {
                      id,
                      type: 'step',
                      position: {
                        x: 250,
                        y: 60 + d.nodes.length * 140,
                      },
                      data: { title: `ステップ ${d.nodes.length + 1}`, manual: '' },
                    },
                  ],
                  updatedAt: Date.now(),
                }
              : d,
          ),
          selectedNodeId: id,
        }))
      },
      addConnectedStep: (sourceId) => {
        const doc = get().activeDoc()
        const source = doc.nodes.find((n) => n.id === sourceId)
        if (!source) return
        const newId = nanoid(6)
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: [
                    ...d.nodes,
                    {
                      id: newId,
                      type: 'step',
                      position: { x: source.position.x, y: source.position.y + 160 },
                      data: { title: `ステップ ${d.nodes.length + 1}`, manual: '' },
                    },
                  ],
                  edges: [
                    ...d.edges,
                    { id: `e-${sourceId}-${newId}`, source: sourceId, target: newId },
                  ],
                  updatedAt: Date.now(),
                }
              : d,
          ),
          selectedNodeId: newId,
        }))
      },
      addMindMapChild: (parentId) => {
        const doc = get().activeDoc()
        const parent = doc.nodes.find((n) => n.id === parentId)
        if (!parent) return
        const parentData = parent.data as MindMapNodeData
        const siblingIndex = doc.edges.filter((e) => e.source === parentId).length
        const isRoot = Boolean(parentData.root)

        let angleDeg: number
        let radius: number
        if (isRoot) {
          angleDeg = siblingIndex * 137.5
          radius = 200
        } else {
          const parentEdge = doc.edges.find((e) => e.target === parentId)
          const grandParent = parentEdge
            ? doc.nodes.find((n) => n.id === parentEdge.source)
            : undefined
          const baseAngle = grandParent
            ? (Math.atan2(
                parent.position.y - grandParent.position.y,
                parent.position.x - grandParent.position.x,
              ) *
                180) /
              Math.PI
            : 0
          const step = 20
          const magnitude = Math.ceil(siblingIndex / 2) * step
          const sign = siblingIndex % 2 === 0 ? 1 : -1
          angleDeg = baseAngle + (siblingIndex === 0 ? 0 : sign * magnitude)
          radius = 160
        }

        const angleRad = (angleDeg * Math.PI) / 180
        const newId = nanoid(6)
        const color = isRoot
          ? BRANCH_COLORS[siblingIndex % BRANCH_COLORS.length]
          : (parentData.color ?? BRANCH_COLORS[0])

        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: [
                    ...d.nodes,
                    {
                      id: newId,
                      type: 'topic',
                      position: {
                        x: parent.position.x + radius * Math.cos(angleRad),
                        y: parent.position.y + radius * Math.sin(angleRad),
                      },
                      data: { text: '', color },
                    },
                  ],
                  edges: [
                    ...d.edges,
                    {
                      id: `e-${parentId}-${newId}`,
                      source: parentId,
                      target: newId,
                      style: { stroke: color, strokeWidth: 2 },
                    },
                  ],
                  updatedAt: Date.now(),
                }
              : d,
          ),
          selectedNodeId: newId,
        }))
      },
      updateStep: (nodeId, data) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: d.nodes.map((n) =>
                    n.id === nodeId
                      ? ({ ...n, data: { ...n.data, ...data } } as AnyStepNode)
                      : n,
                  ),
                  updatedAt: Date.now(),
                }
              : d,
          ),
        }))
      },
      deleteStep: (nodeId) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: d.nodes.filter((n) => n.id !== nodeId),
                  edges: d.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
                  updatedAt: Date.now(),
                }
              : d,
          ),
          selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
        }))
      },

      onNodesChange: (changes) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: applyNodeChanges(
                    changes,
                    d.nodes as Node<Record<string, unknown>>[],
                  ) as AnyStepNode[],
                }
              : d,
          ),
        }))
      },
      onEdgesChange: (changes) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId ? { ...d, edges: applyEdgeChanges(changes, d.edges) } : d,
          ),
        }))
      },
      onConnect: (connection) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? { ...d, edges: addEdge({ ...connection, animated: false }, d.edges) }
              : d,
          ),
        }))
      },

      importDoc: (doc) => {
        set((s) => ({
          docs: [...s.docs, { ...doc, driveFileId: undefined }],
          activeId: doc.id,
          selectedNodeId: null,
        }))
      },
      importFromDrive: (doc, driveFileId) => {
        const localDoc: FlowDoc = { ...doc, id: nanoid(8), driveFileId }
        set((s) => ({ docs: [...s.docs, localDoc], activeId: localDoc.id, selectedNodeId: null }))
      },
      setDriveFileId: (docId, driveFileId) => {
        set((s) => ({
          docs: s.docs.map((d) => (d.id === docId ? { ...d, driveFileId } : d)),
        }))
      },
    }),
    { name: 'flowcraft-storage' },
  ),
)
