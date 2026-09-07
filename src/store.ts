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
import { computeFlowchartLayout } from './lib/flowchartLayout'
import {
  angleToHandle,
  computeMindMapLayoutByStyle,
  OPPOSITE_HANDLE,
  recomputeEdgeHandles,
} from './lib/mindmapLayout'
import { BRANCH_COLORS } from './lib/palette'
import type {
  AnyStepNode,
  DocKind,
  FlowDoc,
  FreeShape,
  MindMapLayoutStyle,
  MindMapNodeData,
  PdcaCycle,
  PdcaDoLog,
  PdcaIssue,
  PdcaSolution,
  StepData,
} from './types'

let nodeClipboard: { type: string; data: Record<string, unknown>; position: { x: number; y: number } } | null =
  null

function withAutoLayout(doc: FlowDoc): FlowDoc {
  if (doc.kind !== 'mindmap' || !doc.mindMapAutoLayout) return doc
  const root = doc.nodes.find((n) => (n.data as MindMapNodeData).root)
  if (!root) return doc
  const positions = computeMindMapLayoutByStyle(doc.mindMapAutoLayout, doc.nodes, doc.edges, root.id)
  return {
    ...doc,
    nodes: doc.nodes.map((n) => {
      const pos = positions.get(n.id)
      return pos ? { ...n, position: pos } : n
    }),
    edges: recomputeEdgeHandles(doc.edges, positions, doc.nodes),
  }
}

const FREE_SHAPE_SIZE: Record<FreeShape, { width: number; height: number }> = {
  rectangle: { width: 160, height: 90 },
  oval: { width: 160, height: 90 },
  diamond: { width: 200, height: 140 },
  parallelogram: { width: 180, height: 90 },
}

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
  if (kind === 'freeform') {
    return {
      id: nanoid(8),
      name,
      kind: 'freeform',
      nodes: [],
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
  selectedEdgeId: string | null
  mode: 'edit' | 'view'
  editRequestNodeId: string | null

  activeDoc: () => FlowDoc
  selectedNode: () => FlowDoc['nodes'][number] | undefined

  setActiveId: (id: string) => void
  setMode: (mode: 'edit' | 'view') => void
  setSelectedNodeId: (id: string | null) => void
  setSelectedEdgeId: (id: string | null) => void
  deleteEdge: (edgeId: string) => void
  updateEdgeLabel: (edgeId: string, label: string | undefined) => void
  updateEdgeType: (edgeId: string, type: string | undefined) => void
  requestEditNode: (nodeId: string) => void
  clearEditRequest: () => void

  createFlow: (kind: DocKind) => void
  renameFlow: (id: string, name: string) => void
  deleteFlow: (id: string) => void

  addStep: (position?: { x: number; y: number }) => void
  addConnectedStep: (sourceId: string, direction?: 'above' | 'below' | 'left' | 'right') => void
  addStickyNote: (position: { x: number; y: number }) => void
  applyFlowchartLayout: () => void
  addMindMapChild: (parentId: string) => void
  addMindMapRoot: (position: { x: number; y: number }) => void
  applyMindMapLayout: (style: MindMapLayoutStyle | null) => void
  swapMindMapSiblings: (nodeIdA: string, nodeIdB: string) => void
  addFreeShape: (shape: FreeShape) => void
  updateStep: (nodeId: string, data: Partial<StepData>) => void
  deleteStep: (nodeId: string) => void
  copySelectedNode: () => void
  pasteNode: () => void

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
      selectedEdgeId: null,
      mode: 'edit',
      editRequestNodeId: null,

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

      setActiveId: (id) => set({ activeId: id, selectedNodeId: null, selectedEdgeId: null }),
      setMode: (mode) => set({ mode, selectedNodeId: null, selectedEdgeId: null }),
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
      deleteEdge: (edgeId) => {
        set((s) => ({
          selectedEdgeId: s.selectedEdgeId === edgeId ? null : s.selectedEdgeId,
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? { ...d, edges: d.edges.filter((e) => e.id !== edgeId), updatedAt: Date.now() }
              : d,
          ),
        }))
      },
      updateEdgeLabel: (edgeId, label) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  edges: d.edges.map((e) => (e.id === edgeId ? { ...e, label } : e)),
                  updatedAt: Date.now(),
                }
              : d,
          ),
        }))
      },
      updateEdgeType: (edgeId, type) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  edges: d.edges.map((e) => (e.id === edgeId ? { ...e, type } : e)),
                  updatedAt: Date.now(),
                }
              : d,
          ),
        }))
      },
      requestEditNode: (nodeId) => set({ editRequestNodeId: nodeId }),
      clearEditRequest: () => set({ editRequestNodeId: null }),

      createFlow: (kind) => {
        const countOfKind = get().docs.filter((d) => (d.kind ?? 'flowchart') === kind).length
        const label =
          kind === 'mindmap' ? 'マインドマップ' : kind === 'freeform' ? 'ホワイトボード' : '新しいフロー'
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

      addStep: (position) => {
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
                      position: position ?? {
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
      addConnectedStep: (sourceId, direction = 'below') => {
        const doc = get().activeDoc()
        const source = doc.nodes.find((n) => n.id === sourceId)
        if (!source) return
        const newId = nanoid(6)
        const offset = {
          above: { x: 0, y: -160 },
          below: { x: 0, y: 160 },
          left: { x: -280, y: 0 },
          right: { x: 280, y: 0 },
        }[direction]
        const newEdge = {
          above: {
            id: `e-${newId}-${sourceId}`,
            source: newId,
            sourceHandle: 'bottom',
            target: sourceId,
            targetHandle: 'top',
          },
          below: {
            id: `e-${sourceId}-${newId}`,
            source: sourceId,
            sourceHandle: 'bottom',
            target: newId,
            targetHandle: 'top',
          },
          left: {
            id: `e-${newId}-${sourceId}`,
            source: newId,
            sourceHandle: 'right',
            target: sourceId,
            targetHandle: 'left',
          },
          right: {
            id: `e-${sourceId}-${newId}`,
            source: sourceId,
            sourceHandle: 'right',
            target: newId,
            targetHandle: 'left',
          },
        }[direction]
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
                      position: { x: source.position.x + offset.x, y: source.position.y + offset.y },
                      data: { title: `ステップ ${d.nodes.length + 1}`, manual: '' },
                    },
                  ],
                  edges: [...d.edges, newEdge],
                  updatedAt: Date.now(),
                }
              : d,
          ),
          selectedNodeId: newId,
        }))
      },
      addStickyNote: (position) => {
        const id = nanoid(6)
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: [...d.nodes, { id, type: 'note', position, data: { text: '' } }],
                  updatedAt: Date.now(),
                }
              : d,
          ),
          selectedNodeId: id,
        }))
      },
      applyFlowchartLayout: () => {
        const doc = get().activeDoc()
        const positions = computeFlowchartLayout(doc.nodes, doc.edges)
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: d.nodes.map((n) => {
                    const pos = positions.get(n.id)
                    return pos ? { ...n, position: pos } : n
                  }),
                  updatedAt: Date.now(),
                }
              : d,
          ),
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
        const sourceHandle = angleToHandle(angleDeg)
        const targetHandle = OPPOSITE_HANDLE[sourceHandle]

        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? withAutoLayout({
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
                      sourceHandle,
                      targetHandle,
                      style: { stroke: color, strokeWidth: 2 },
                    },
                  ],
                  updatedAt: Date.now(),
                })
              : d,
          ),
          selectedNodeId: newId,
        }))
      },
      addMindMapRoot: (position) => {
        const newId = nanoid(6)
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? withAutoLayout({
                  ...d,
                  nodes: [
                    ...d.nodes,
                    {
                      id: newId,
                      type: 'topic',
                      position,
                      data: { text: '', root: true },
                    },
                  ],
                  updatedAt: Date.now(),
                })
              : d,
          ),
          selectedNodeId: newId,
        }))
      },
      applyMindMapLayout: (style) => {
        if (style === null) {
          set((s) => ({
            docs: s.docs.map((d) =>
              d.id === s.activeId ? { ...d, mindMapAutoLayout: null } : d,
            ),
          }))
          return
        }

        const doc = get().activeDoc()
        const root = doc.nodes.find((n) => (n.data as MindMapNodeData).root)
        if (!root) return

        const positions = computeMindMapLayoutByStyle(style, doc.nodes, doc.edges, root.id)

        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  mindMapAutoLayout: style,
                  nodes: d.nodes.map((n) => {
                    const pos = positions.get(n.id)
                    return pos ? { ...n, position: pos } : n
                  }),
                  edges: recomputeEdgeHandles(d.edges, positions, d.nodes),
                  updatedAt: Date.now(),
                }
              : d,
          ),
        }))
      },
      swapMindMapSiblings: (nodeIdA, nodeIdB) => {
        if (nodeIdA === nodeIdB) return
        const doc = get().activeDoc()
        const edgeA = doc.edges.find((e) => e.target === nodeIdA)
        const edgeB = doc.edges.find((e) => e.target === nodeIdB)
        // Only two nodes hanging off the same parent have a well-defined
        // "swap": it's a reorder of that parent's children, which the
        // layout functions read straight off edges-array order.
        if (!edgeA || !edgeB || edgeA.source !== edgeB.source) return
        const indexA = doc.edges.indexOf(edgeA)
        const indexB = doc.edges.indexOf(edgeB)
        const swappedEdges = [...doc.edges]
        swappedEdges[indexA] = edgeB
        swappedEdges[indexB] = edgeA

        const root = doc.nodes.find((n) => (n.data as MindMapNodeData).root)
        if (!root || !doc.mindMapAutoLayout) {
          set((s) => ({
            docs: s.docs.map((d) =>
              d.id === s.activeId ? { ...d, edges: swappedEdges, updatedAt: Date.now() } : d,
            ),
          }))
          return
        }

        const positions = computeMindMapLayoutByStyle(doc.mindMapAutoLayout, doc.nodes, swappedEdges, root.id)
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: d.nodes.map((n) => {
                    const pos = positions.get(n.id)
                    return pos ? { ...n, position: pos } : n
                  }),
                  edges: recomputeEdgeHandles(swappedEdges, positions, d.nodes),
                  updatedAt: Date.now(),
                }
              : d,
          ),
        }))
      },
      addFreeShape: (shape) => {
        const id = nanoid(6)
        const { width, height } = FREE_SHAPE_SIZE[shape]
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: [
                    ...d.nodes,
                    {
                      id,
                      type: 'freeshape',
                      position: {
                        x: 150 + (d.nodes.length % 4) * 240,
                        y: 120 + Math.floor(d.nodes.length / 4) * 180,
                      },
                      width,
                      height,
                      data: {
                        text: '',
                        shape,
                        color: BRANCH_COLORS[d.nodes.length % BRANCH_COLORS.length],
                      },
                    },
                  ],
                  updatedAt: Date.now(),
                }
              : d,
          ),
          selectedNodeId: id,
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
              ? withAutoLayout({
                  ...d,
                  nodes: d.nodes.filter((n) => n.id !== nodeId),
                  edges: d.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
                  updatedAt: Date.now(),
                })
              : d,
          ),
          selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
        }))
      },
      copySelectedNode: () => {
        const state = get()
        const node = state.activeDoc().nodes.find((n) => n.id === state.selectedNodeId)
        if (!node) return
        nodeClipboard = {
          type: node.type ?? 'step',
          data: structuredClone(node.data) as Record<string, unknown>,
          position: { ...node.position },
        }
      },
      pasteNode: () => {
        if (!nodeClipboard) return
        const clip = nodeClipboard
        const id = nanoid(6)
        const position = { x: clip.position.x + 40, y: clip.position.y + 40 }
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: [
                    ...d.nodes,
                    { id, type: clip.type, position, data: structuredClone(clip.data) } as AnyStepNode,
                  ],
                  updatedAt: Date.now(),
                }
              : d,
          ),
          selectedNodeId: id,
        }))
        nodeClipboard = { ...clip, position }
      },

      onNodesChange: (changes) => {
        const hasDimensionChange = changes.some((c) => c.type === 'dimensions')
        // React Flow fires "dimensions" changes on its own (measuring nodes on
        // mount, font loading, etc.) and "select" changes on every click or
        // marquee-selection, neither of which is a real edit. Only bump
        // updatedAt for changes that actually reflect something the user did
        // (drag, delete, resize), so auto-save doesn't fire on selection or
        // incidental re-measures.
        const isUserEdit = changes.some((c) => c.type !== 'dimensions' && c.type !== 'select')
        set((s) => ({
          docs: s.docs.map((d) => {
            if (d.id !== s.activeId) return d
            const updated: FlowDoc = {
              ...d,
              nodes: applyNodeChanges(
                changes,
                d.nodes as Node<Record<string, unknown>>[],
              ) as AnyStepNode[],
              ...(isUserEdit ? { updatedAt: Date.now() } : undefined),
            }
            return hasDimensionChange ? withAutoLayout(updated) : updated
          }),
        }))
      },
      onEdgesChange: (changes) => {
        // Same reasoning as onNodesChange: a plain click/marquee selection on
        // an edge is not an edit and shouldn't trigger auto-save.
        const isUserEdit = changes.some((c) => c.type !== 'select')
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  edges: applyEdgeChanges(changes, d.edges),
                  ...(isUserEdit ? { updatedAt: Date.now() } : undefined),
                }
              : d,
          ),
        }))
      },
      onConnect: (connection) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? { ...d, edges: addEdge({ ...connection, animated: false }, d.edges), updatedAt: Date.now() }
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

export type UiSection = DocKind | 'reflection' | 'daily' | 'home'

interface UiStore {
  section: UiSection
  setSection: (section: UiSection) => void
}

export const useUiStore = create<UiStore>((set) => ({
  section: 'home',
  setSection: (section) => set({ section }),
}))

// Fields have been added to PdcaCycle (and PdcaIssue) incrementally;
// normalize whatever shape a persisted or Drive-loaded cycle actually has
// (which may predate some fields) so the UI never hits undefined.gap or
// undefined.impact.
function normalizeSolution(sol: Partial<PdcaSolution> & { id: string }): PdcaSolution {
  return {
    id: sol.id,
    text: sol.text ?? '',
    impact: sol.impact ?? null,
    timeHours: sol.timeHours ?? null,
    ease: sol.ease ?? null,
  }
}

function normalizeIssue(i: Partial<PdcaIssue> & { id: string }): PdcaIssue {
  return {
    id: i.id,
    text: i.text ?? '',
    impact: i.impact ?? null,
    timeAmount: i.timeAmount ?? null,
    timeUnit: i.timeUnit ?? 'weeks',
    ease: i.ease ?? null,
    selected: i.selected ?? false,
    kpi: i.kpi ?? '',
    solutions: (i.solutions ?? []).map((sol) => normalizeSolution(sol as Partial<PdcaSolution> & { id: string })),
  }
}

function normalizeCycle(c: Partial<PdcaCycle> & { id: string }): PdcaCycle {
  return {
    id: c.id,
    title: c.title ?? '',
    kgiGoal: c.kgiGoal ?? '',
    kgiDeadline: c.kgiDeadline ?? '',
    currentState: c.currentState ?? '',
    gap: c.gap ?? '',
    issues: (c.issues ?? []).map((i) => normalizeIssue(i as Partial<PdcaIssue> & { id: string })),
    createdAt: c.createdAt ?? Date.now(),
    updatedAt: c.updatedAt ?? Date.now(),
  }
}

function normalizeDoLog(l: Partial<PdcaDoLog> & { id: string }): PdcaDoLog {
  return {
    id: l.id,
    solutionId: l.solutionId ?? '',
    date: l.date ?? '',
    done: l.done ?? false,
    note: l.note ?? '',
  }
}

const MAX_SELECTED_ISSUES = 3

interface PdcaStore {
  cycles: PdcaCycle[]
  activeCycleId: string | null
  doLogs: PdcaDoLog[]
  driveFileId?: string
  activeCycle: () => PdcaCycle | undefined
  setActiveCycleId: (id: string | null) => void
  createCycle: (title: string) => string
  updateCycle: (
    cycleId: string,
    patch: Partial<Pick<PdcaCycle, 'title' | 'kgiGoal' | 'kgiDeadline' | 'currentState' | 'gap'>>,
  ) => void
  deleteCycle: (cycleId: string) => void
  addIssue: (cycleId: string, text: string) => void
  updateIssue: (cycleId: string, issueId: string, text: string) => void
  deleteIssue: (cycleId: string, issueId: string) => void
  rateIssue: (
    cycleId: string,
    issueId: string,
    patch: Partial<Pick<PdcaIssue, 'impact' | 'timeAmount' | 'timeUnit' | 'ease' | 'kpi'>>,
  ) => void
  toggleIssueSelected: (cycleId: string, issueId: string) => void
  addSolution: (cycleId: string, issueId: string, text: string) => void
  updateSolution: (cycleId: string, issueId: string, solutionId: string, text: string) => void
  deleteSolution: (cycleId: string, issueId: string, solutionId: string) => void
  rateSolution: (
    cycleId: string,
    issueId: string,
    solutionId: string,
    patch: Partial<Pick<PdcaSolution, 'impact' | 'timeHours' | 'ease'>>,
  ) => void
  upsertDoLog: (solutionId: string, date: string, patch: Partial<Pick<PdcaDoLog, 'done' | 'note'>>) => void
  setDriveFileId: (driveFileId: string) => void
  mergeFromDrive: (remoteCycles: PdcaCycle[]) => void
}

export const usePdcaStore = create<PdcaStore>()(
  persist(
    (set, get) => ({
      cycles: [],
      activeCycleId: null,
      doLogs: [],
      driveFileId: undefined,
      activeCycle: () => get().cycles.find((c) => c.id === get().activeCycleId),
      setActiveCycleId: (id) => set({ activeCycleId: id }),
      createCycle: (title) => {
        const id = nanoid(8)
        const cycle: PdcaCycle = {
          id,
          title,
          kgiGoal: '',
          kgiDeadline: '',
          currentState: '',
          gap: '',
          issues: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({ cycles: [...s.cycles, cycle], activeCycleId: id }))
        return id
      },
      updateCycle: (cycleId, patch) => {
        set((s) => ({
          cycles: s.cycles.map((c) => (c.id === cycleId ? { ...c, ...patch, updatedAt: Date.now() } : c)),
        }))
      },
      deleteCycle: (cycleId) => {
        set((s) => ({
          cycles: s.cycles.filter((c) => c.id !== cycleId),
          activeCycleId: s.activeCycleId === cycleId ? null : s.activeCycleId,
        }))
      },
      addIssue: (cycleId, text) => {
        const issue: PdcaIssue = {
          id: nanoid(6),
          text,
          impact: null,
          timeAmount: null,
          timeUnit: 'weeks',
          ease: null,
          selected: false,
          kpi: '',
          solutions: [],
        }
        set((s) => ({
          cycles: s.cycles.map((c) =>
            c.id === cycleId ? { ...c, issues: [...c.issues, issue], updatedAt: Date.now() } : c,
          ),
        }))
      },
      updateIssue: (cycleId, issueId, text) => {
        set((s) => ({
          cycles: s.cycles.map((c) =>
            c.id === cycleId
              ? {
                  ...c,
                  issues: c.issues.map((i) => (i.id === issueId ? { ...i, text } : i)),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }))
      },
      deleteIssue: (cycleId, issueId) => {
        set((s) => ({
          cycles: s.cycles.map((c) =>
            c.id === cycleId
              ? { ...c, issues: c.issues.filter((i) => i.id !== issueId), updatedAt: Date.now() }
              : c,
          ),
        }))
      },
      rateIssue: (cycleId, issueId, patch) => {
        set((s) => ({
          cycles: s.cycles.map((c) =>
            c.id === cycleId
              ? {
                  ...c,
                  issues: c.issues.map((i) => (i.id === issueId ? { ...i, ...patch } : i)),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }))
      },
      toggleIssueSelected: (cycleId, issueId) => {
        set((s) => ({
          cycles: s.cycles.map((c) => {
            if (c.id !== cycleId) return c
            const target = c.issues.find((i) => i.id === issueId)
            if (!target) return c
            const selectedCount = c.issues.filter((i) => i.selected).length
            if (!target.selected && selectedCount >= MAX_SELECTED_ISSUES) return c
            return {
              ...c,
              issues: c.issues.map((i) => (i.id === issueId ? { ...i, selected: !i.selected } : i)),
              updatedAt: Date.now(),
            }
          }),
        }))
      },
      addSolution: (cycleId, issueId, text) => {
        set((s) => ({
          cycles: s.cycles.map((c) =>
            c.id === cycleId
              ? {
                  ...c,
                  issues: c.issues.map((i) =>
                    i.id === issueId
                      ? {
                          ...i,
                          solutions: [
                            ...i.solutions,
                            { id: nanoid(6), text, impact: null, timeHours: null, ease: null },
                          ],
                        }
                      : i,
                  ),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }))
      },
      updateSolution: (cycleId, issueId, solutionId, text) => {
        set((s) => ({
          cycles: s.cycles.map((c) =>
            c.id === cycleId
              ? {
                  ...c,
                  issues: c.issues.map((i) =>
                    i.id === issueId
                      ? {
                          ...i,
                          solutions: i.solutions.map((sol) => (sol.id === solutionId ? { ...sol, text } : sol)),
                        }
                      : i,
                  ),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }))
      },
      deleteSolution: (cycleId, issueId, solutionId) => {
        set((s) => ({
          cycles: s.cycles.map((c) =>
            c.id === cycleId
              ? {
                  ...c,
                  issues: c.issues.map((i) =>
                    i.id === issueId
                      ? { ...i, solutions: i.solutions.filter((sol) => sol.id !== solutionId) }
                      : i,
                  ),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }))
      },
      rateSolution: (cycleId, issueId, solutionId, patch) => {
        set((s) => ({
          cycles: s.cycles.map((c) =>
            c.id === cycleId
              ? {
                  ...c,
                  issues: c.issues.map((i) =>
                    i.id === issueId
                      ? {
                          ...i,
                          solutions: i.solutions.map((sol) =>
                            sol.id === solutionId ? { ...sol, ...patch } : sol,
                          ),
                        }
                      : i,
                  ),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }))
      },
      upsertDoLog: (solutionId, date, patch) => {
        set((s) => {
          const existing = s.doLogs.find((l) => l.solutionId === solutionId && l.date === date)
          if (existing) {
            return {
              doLogs: s.doLogs.map((l) => (l.id === existing.id ? { ...l, ...patch } : l)),
            }
          }
          return {
            doLogs: [
              ...s.doLogs,
              { id: nanoid(6), solutionId, date, done: false, note: '', ...patch },
            ],
          }
        })
      },
      setDriveFileId: (driveFileId) => set({ driveFileId }),
      mergeFromDrive: (remoteCycles) => {
        set((s) => {
          const merged = [...s.cycles]
          for (const rawRemote of remoteCycles) {
            const remote = normalizeCycle(rawRemote)
            const localIndex = merged.findIndex((c) => c.id === remote.id)
            if (localIndex === -1) {
              merged.push(remote)
            } else if (remote.updatedAt > merged[localIndex].updatedAt) {
              merged[localIndex] = remote
            }
          }
          return { cycles: merged }
        })
      },
    }),
    {
      name: 'flowcraft-pdca',
      version: 4,
      migrate: (persisted) => {
        const state = persisted as { cycles?: unknown[]; doLogs?: unknown[] } | undefined
        const cycles = Array.isArray(state?.cycles)
          ? state.cycles.map((c) => normalizeCycle(c as Partial<PdcaCycle> & { id: string }))
          : []
        const doLogs = Array.isArray(state?.doLogs)
          ? state.doLogs.map((l) => normalizeDoLog(l as Partial<PdcaDoLog> & { id: string }))
          : []
        return { ...state, cycles, doLogs }
      },
    },
  ),
)

