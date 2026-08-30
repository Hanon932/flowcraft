import { create } from 'zustand'
import { useFlowStore } from './store'
import type { FlowDoc } from './types'

const MAX_HISTORY = 50
const DEBOUNCE_MS = 150

interface UndoStatus {
  canUndo: boolean
  canRedo: boolean
}

export const useUndoStatus = create<UndoStatus>(() => ({ canUndo: false, canRedo: false }))

const IGNORE_WINDOW_MS = 250

let past: FlowDoc[] = []
let future: FlowDoc[] = []
let pendingBefore: FlowDoc | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let trackedActiveId = useFlowStore.getState().activeId
let ignoreUntil = 0
let prevState = useFlowStore.getState()

function updateStatus() {
  useUndoStatus.setState({
    canUndo: past.length > 0 || pendingBefore !== null,
    canRedo: future.length > 0,
  })
}

function commitPending() {
  if (pendingBefore) {
    past.push(pendingBefore)
    if (past.length > MAX_HISTORY) past.shift()
    pendingBefore = null
  }
  debounceTimer = null
  updateStatus()
}

useFlowStore.subscribe((state) => {
  if (Date.now() < ignoreUntil) {
    prevState = state
    return
  }

  if (state.activeId !== trackedActiveId) {
    if (debounceTimer) clearTimeout(debounceTimer)
    past = []
    future = []
    pendingBefore = null
    trackedActiveId = state.activeId
    updateStatus()
    prevState = state
    return
  }

  const prevDoc = prevState.docs.find((d) => d.id === trackedActiveId)
  const nextDoc = state.docs.find((d) => d.id === trackedActiveId)
  if (prevDoc && nextDoc && prevDoc !== nextDoc) {
    if (!pendingBefore) pendingBefore = structuredClone(prevDoc)
    future = []
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(commitPending, DEBOUNCE_MS)
    updateStatus()
  }
  prevState = state
})

export function undo() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  commitPending()

  const state = useFlowStore.getState()
  const currentDoc = state.docs.find((d) => d.id === state.activeId)
  if (!currentDoc || past.length === 0) return
  const prevDoc = past.pop()!
  future.push(structuredClone(currentDoc))

  ignoreUntil = Date.now() + IGNORE_WINDOW_MS
  useFlowStore.setState((s) => ({
    docs: s.docs.map((d) => (d.id === state.activeId ? prevDoc : d)),
    selectedNodeId: null,
  }))
  updateStatus()
}

export function redo() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  commitPending()

  const state = useFlowStore.getState()
  const currentDoc = state.docs.find((d) => d.id === state.activeId)
  if (!currentDoc || future.length === 0) return
  const nextDoc = future.pop()!
  past.push(structuredClone(currentDoc))

  ignoreUntil = Date.now() + IGNORE_WINDOW_MS
  useFlowStore.setState((s) => ({
    docs: s.docs.map((d) => (d.id === state.activeId ? nextDoc : d)),
    selectedNodeId: null,
  }))
  updateStatus()
}
