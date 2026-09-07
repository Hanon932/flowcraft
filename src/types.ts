import type { Edge, Node } from 'reactflow'

export type StepShape = 'rectangle' | 'oval' | 'diamond' | 'parallelogram'

export interface StepData {
  title: string
  manual: string
  shape?: StepShape
  color?: string
  [key: string]: unknown
}

export type StepNode = Node<StepData>

export type DocKind = 'flowchart' | 'mindmap' | 'freeform'

export type MindMapLayoutStyle = 'radial' | 'tree' | 'vertical' | 'balanced'

export interface MindMapNodeData {
  text: string
  color?: string
  root?: boolean
  collapsed?: boolean
  [key: string]: unknown
}

export type MindMapNode = Node<MindMapNodeData>

export type FreeShape = 'rectangle' | 'oval' | 'diamond' | 'parallelogram'

export interface FreeShapeData {
  text: string
  shape: FreeShape
  color?: string
  [key: string]: unknown
}

export type FreeShapeNode = Node<FreeShapeData>

export interface StickyNoteData {
  text: string
  color?: string
  [key: string]: unknown
}

export type StickyNoteNode = Node<StickyNoteData>

export type AnyStepNode = StepNode | MindMapNode | FreeShapeNode | StickyNoteNode

export interface FlowDoc {
  id: string
  name: string
  kind?: DocKind
  nodes: AnyStepNode[]
  edges: Edge[]
  updatedAt: number
  driveFileId?: string
  mindMapAutoLayout?: MindMapLayoutStyle | null
}

export type PdcaGrade = 'A' | 'B' | 'C' | null
export type PdcaTimeUnit = 'weeks' | 'months'

export interface PdcaSolution {
  id: string
  text: string
  impact: PdcaGrade
  timeHours: number | null
  ease: PdcaGrade
}

// One day's execution record for a single DO (PdcaSolution). Keyed by
// solutionId + date so history isn't overwritten as days pass.
export interface PdcaDoLog {
  id: string
  solutionId: string
  date: string
  done: boolean
  note: string
}

export interface PdcaIssue {
  id: string
  text: string
  impact: PdcaGrade
  timeAmount: number | null
  timeUnit: PdcaTimeUnit
  ease: PdcaGrade
  selected: boolean
  kpi: string
  solutions: PdcaSolution[]
}

// 鬼速PDCA-style cycle. Being rebuilt step by step, starting from just the
// KGI (quantified ultimate goal) — more fields land as the flow grows.
export interface PdcaCycle {
  id: string
  title: string
  kgiGoal: string
  kgiDeadline: string
  currentState: string
  gap: string
  issues: PdcaIssue[]
  createdAt: number
  updatedAt: number
}
