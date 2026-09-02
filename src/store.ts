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
  GoalProfile,
  MindMapLayoutStyle,
  MindMapNodeData,
  MonthlyGoal,
  ReflectionEntry,
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
  createGoalRoadmap: (title: string) => string
  renameFlow: (id: string, name: string) => void
  deleteFlow: (id: string) => void

  addStep: (position?: { x: number; y: number }) => void
  addConnectedStep: (sourceId: string, direction?: 'above' | 'below' | 'left' | 'right') => void
  addStickyNote: (position: { x: number; y: number }) => void
  applyFlowchartLayout: () => void
  addMindMapChild: (parentId: string) => void
  addMindMapRoot: (position: { x: number; y: number }) => void
  applyMindMapLayout: (style: MindMapLayoutStyle | null) => void
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
      createGoalRoadmap: (title) => {
        const doc = createDoc(title || '目標ロードマップ', 'mindmap')
        doc.nodes = [
          {
            ...doc.nodes[0],
            data: { ...doc.nodes[0].data, text: title || '目標' },
          },
        ]
        set((s) => ({ docs: [...s.docs, doc], activeId: doc.id, selectedNodeId: null }))
        return doc.id
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

export type UiSection = DocKind | 'reflection'

interface UiStore {
  section: UiSection
  setSection: (section: UiSection) => void
}

export const useUiStore = create<UiStore>((set) => ({
  section: 'flowchart',
  setSection: (section) => set({ section }),
}))

interface ReflectionStore {
  entries: ReflectionEntry[]
  driveFileId?: string
  getEntry: (date: string) => ReflectionEntry | undefined
  upsertEntry: (
    date: string,
    patch: Partial<Pick<ReflectionEntry, 'problem' | 'improvement' | 'goalAction'>>,
  ) => void
  deleteEntry: (id: string) => void
  setDriveFileId: (driveFileId: string) => void
  mergeFromDrive: (remoteEntries: ReflectionEntry[]) => void
}

export const useReflectionStore = create<ReflectionStore>()(
  persist(
    (set, get) => ({
      entries: [],
      driveFileId: undefined,
      getEntry: (date) => get().entries.find((e) => e.date === date),
      upsertEntry: (date, patch) => {
        set((s) => {
          const existing = s.entries.find((e) => e.date === date)
          if (existing) {
            return {
              entries: s.entries.map((e) =>
                e.id === existing.id ? { ...e, ...patch, updatedAt: Date.now() } : e,
              ),
            }
          }
          const entry: ReflectionEntry = {
            id: nanoid(8),
            date,
            problem: '',
            improvement: '',
            goalAction: '',
            ...patch,
            updatedAt: Date.now(),
          }
          return { entries: [...s.entries, entry] }
        })
      },
      deleteEntry: (id) => {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
      },
      setDriveFileId: (driveFileId) => set({ driveFileId }),
      mergeFromDrive: (remoteEntries) => {
        set((s) => {
          const merged = [...s.entries]
          for (const remote of remoteEntries) {
            const localIndex = merged.findIndex((e) => e.date === remote.date)
            if (localIndex === -1) {
              merged.push(remote)
            } else if (remote.updatedAt > merged[localIndex].updatedAt) {
              merged[localIndex] = remote
            }
          }
          return { entries: merged }
        })
      },
    }),
    { name: 'flowcraft-reflections' },
  ),
)

interface GoalStore {
  goals: MonthlyGoal[]
  driveFileId?: string
  getGoal: (month: string) => MonthlyGoal | undefined
  upsertGoal: (
    month: string,
    patch: Partial<Pick<MonthlyGoal, 'plan' | 'doPlan' | 'check' | 'act'>>,
  ) => void
  setDriveFileId: (driveFileId: string) => void
  mergeFromDrive: (remoteGoals: MonthlyGoal[]) => void
}

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      goals: [],
      driveFileId: undefined,
      getGoal: (month) => get().goals.find((g) => g.month === month),
      upsertGoal: (month, patch) => {
        set((s) => {
          const existing = s.goals.find((g) => g.month === month)
          if (existing) {
            return {
              goals: s.goals.map((g) =>
                g.id === existing.id ? { ...g, ...patch, updatedAt: Date.now() } : g,
              ),
            }
          }
          const goal: MonthlyGoal = {
            id: nanoid(8),
            month,
            plan: '',
            doPlan: '',
            check: '',
            act: '',
            ...patch,
            updatedAt: Date.now(),
          }
          return { goals: [...s.goals, goal] }
        })
      },
      setDriveFileId: (driveFileId) => set({ driveFileId }),
      mergeFromDrive: (remoteGoals) => {
        set((s) => {
          const merged = [...s.goals]
          for (const remote of remoteGoals) {
            const localIndex = merged.findIndex((g) => g.month === remote.month)
            if (localIndex === -1) {
              merged.push(remote)
            } else if (remote.updatedAt > merged[localIndex].updatedAt) {
              merged[localIndex] = remote
            }
          }
          return { goals: merged }
        })
      },
    }),
    { name: 'flowcraft-goals' },
  ),
)

interface GoalProfileStore extends GoalProfile {
  setGoal: (patch: Partial<Pick<GoalProfile, 'title' | 'why'>>) => void
  setRoadmapDocId: (roadmapDocId: string) => void
  setDriveFileId: (driveFileId: string) => void
  mergeFromDrive: (remote: GoalProfile) => void
}

export const useGoalProfileStore = create<GoalProfileStore>()(
  persist(
    (set, get) => ({
      title: '',
      why: '',
      roadmapDocId: undefined,
      driveFileId: undefined,
      updatedAt: 0,
      setGoal: (patch) => set({ ...patch, updatedAt: Date.now() }),
      setRoadmapDocId: (roadmapDocId) => set({ roadmapDocId, updatedAt: Date.now() }),
      setDriveFileId: (driveFileId) => set({ driveFileId }),
      mergeFromDrive: (remote) => {
        if (remote.updatedAt > get().updatedAt) {
          set({ ...remote })
        }
      },
    }),
    { name: 'flowcraft-goal-profile' },
  ),
)
