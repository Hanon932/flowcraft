import type { Edge, Node } from 'reactflow'

export type StepShape = 'rectangle' | 'oval' | 'diamond' | 'parallelogram'

export interface StepData {
  title: string
  manual: string
  shape?: StepShape
  [key: string]: unknown
}

export type StepNode = Node<StepData>

export type DocKind = 'flowchart' | 'mindmap'

export interface MindMapNodeData {
  text: string
  color?: string
  root?: boolean
  [key: string]: unknown
}

export type MindMapNode = Node<MindMapNodeData>

export type AnyStepNode = StepNode | MindMapNode

export interface FlowDoc {
  id: string
  name: string
  kind?: DocKind
  nodes: AnyStepNode[]
  edges: Edge[]
  updatedAt: number
  driveFileId?: string
}
