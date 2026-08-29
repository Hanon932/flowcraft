import type { Edge, Node } from 'reactflow'

export type StepShape = 'rectangle' | 'oval' | 'diamond' | 'parallelogram'

export interface StepData {
  title: string
  manual: string
  shape?: StepShape
  [key: string]: unknown
}

export type StepNode = Node<StepData>

export interface FlowDoc {
  id: string
  name: string
  nodes: StepNode[]
  edges: Edge[]
  updatedAt: number
  driveFileId?: string
}
