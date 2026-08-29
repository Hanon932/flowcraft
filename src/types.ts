import type { Edge, Node } from 'reactflow'

export interface StepData {
  title: string
  manual: string
  [key: string]: unknown
}

export type StepNode = Node<StepData>

export interface FlowDoc {
  id: string
  name: string
  nodes: StepNode[]
  edges: Edge[]
  updatedAt: number
}
