import { nanoid } from 'nanoid'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from 'reactflow'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FlowDoc, StepData } from './types'

function createDoc(name: string): FlowDoc {
  return {
    id: nanoid(8),
    name,
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

  createFlow: () => void
  renameFlow: (id: string, name: string) => void
  deleteFlow: (id: string) => void

  addStep: () => void
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

      createFlow: () => {
        const doc = createDoc(`新しいフロー ${get().docs.length + 1}`)
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
      updateStep: (nodeId, data) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === s.activeId
              ? {
                  ...d,
                  nodes: d.nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
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
            d.id === s.activeId ? { ...d, nodes: applyNodeChanges(changes, d.nodes) } : d,
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
