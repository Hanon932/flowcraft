import type { Edge, Node } from 'reactflow'

export type StepShape = 'rectangle' | 'oval' | 'diamond' | 'parallelogram'

export interface StepData {
  title: string
  manual: string
  shape?: StepShape
  [key: string]: unknown
}

export type StepNode = Node<StepData>

export type DocKind = 'flowchart' | 'mindmap' | 'freeform'

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

export type AnyStepNode = StepNode | MindMapNode | FreeShapeNode

export interface FlowDoc {
  id: string
  name: string
  kind?: DocKind
  nodes: AnyStepNode[]
  edges: Edge[]
  updatedAt: number
  driveFileId?: string
}
