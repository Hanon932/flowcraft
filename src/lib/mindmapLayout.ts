import type { Edge } from 'reactflow'
import type { AnyStepNode, MindMapLayoutStyle, MindMapNodeData } from '../types'

export type HandleSide = 'top' | 'right' | 'bottom' | 'left'

export function angleToHandle(deg: number): HandleSide {
  const a = ((deg % 360) + 360) % 360
  if (a >= 315 || a < 45) return 'right'
  if (a >= 45 && a < 135) return 'bottom'
  if (a >= 135 && a < 225) return 'left'
  return 'top'
}

export const OPPOSITE_HANDLE: Record<HandleSide, HandleSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

export function buildChildrenMap(nodes: AnyStepNode[], edges: Edge[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const n of nodes) map.set(n.id, [])
  for (const e of edges) {
    if (map.has(e.source)) map.get(e.source)!.push(e.target)
  }
  return map
}

export function countLeaves(
  nodeId: string,
  childrenMap: Map<string, string[]>,
  memo: Map<string, number>,
): number {
  if (memo.has(nodeId)) return memo.get(nodeId)!
  const children = childrenMap.get(nodeId) ?? []
  const count =
    children.length === 0
      ? 1
      : children.reduce((sum, c) => sum + countLeaves(c, childrenMap, memo), 0)
  memo.set(nodeId, count)
  return count
}

type Positions = Map<string, { x: number; y: number }>

const RADIAL_RADIUS_STEP = 220
const TREE_X_STEP = 260
const TREE_Y_STEP = 90

export function computeRadialLayout(
  nodes: AnyStepNode[],
  edges: Edge[],
  rootId: string,
): Positions {
  const childrenMap = buildChildrenMap(nodes, edges)
  const leafMemo = new Map<string, number>()
  countLeaves(rootId, childrenMap, leafMemo)

  const positions: Positions = new Map()
  const rootNode = nodes.find((n) => n.id === rootId)
  const center = rootNode ? rootNode.position : { x: 0, y: 0 }
  positions.set(rootId, { ...center })

  function place(nodeId: string, angleStart: number, angleEnd: number, depth: number) {
    const children = childrenMap.get(nodeId) ?? []
    if (children.length === 0) return
    const total = leafMemo.get(nodeId) ?? 1
    let cursor = angleStart
    for (const childId of children) {
      const weight = (leafMemo.get(childId) ?? 1) / total
      const span = (angleEnd - angleStart) * weight
      const childStart = cursor
      const childEnd = cursor + span
      const midAngle = (childStart + childEnd) / 2
      const radius = RADIAL_RADIUS_STEP * depth
      const rad = (midAngle * Math.PI) / 180
      positions.set(childId, {
        x: center.x + radius * Math.cos(rad),
        y: center.y + radius * Math.sin(rad),
      })
      place(childId, childStart, childEnd, depth + 1)
      cursor = childEnd
    }
  }

  place(rootId, 0, 360, 1)
  return positions
}

export function computeTreeLayout(nodes: AnyStepNode[], edges: Edge[], rootId: string): Positions {
  const childrenMap = buildChildrenMap(nodes, edges)
  const positions: Positions = new Map()
  const rootNode = nodes.find((n) => n.id === rootId)
  const origin = rootNode ? rootNode.position : { x: 0, y: 0 }
  let leafCursor = 0

  function place(nodeId: string, depth: number): number {
    const children = childrenMap.get(nodeId) ?? []
    if (children.length === 0) {
      const y = origin.y + leafCursor * TREE_Y_STEP
      leafCursor += 1
      positions.set(nodeId, { x: origin.x + depth * TREE_X_STEP, y })
      return y
    }
    const childYs = children.map((c) => place(c, depth + 1))
    const y = childYs.reduce((a, b) => a + b, 0) / childYs.length
    positions.set(nodeId, { x: origin.x + depth * TREE_X_STEP, y })
    return y
  }

  place(rootId, 0)
  return positions
}

const VERTICAL_TREE_X_STEP = 190
const VERTICAL_TREE_Y_STEP = 150

export function computeVerticalTreeLayout(
  nodes: AnyStepNode[],
  edges: Edge[],
  rootId: string,
): Positions {
  const childrenMap = buildChildrenMap(nodes, edges)
  const positions: Positions = new Map()
  const rootNode = nodes.find((n) => n.id === rootId)
  const origin = rootNode ? rootNode.position : { x: 0, y: 0 }
  let leafCursor = 0

  function place(nodeId: string, depth: number): number {
    const children = childrenMap.get(nodeId) ?? []
    if (children.length === 0) {
      const x = origin.x + leafCursor * VERTICAL_TREE_X_STEP
      leafCursor += 1
      positions.set(nodeId, { x, y: origin.y + depth * VERTICAL_TREE_Y_STEP })
      return x
    }
    const childXs = children.map((c) => place(c, depth + 1))
    const x = childXs.reduce((a, b) => a + b, 0) / childXs.length
    positions.set(nodeId, { x, y: origin.y + depth * VERTICAL_TREE_Y_STEP })
    return x
  }

  place(rootId, 0)
  return positions
}

export function computeBalancedLayout(
  nodes: AnyStepNode[],
  edges: Edge[],
  rootId: string,
): Positions {
  const childrenMap = buildChildrenMap(nodes, edges)
  const leafMemo = new Map<string, number>()
  countLeaves(rootId, childrenMap, leafMemo)

  const positions: Positions = new Map()
  const rootNode = nodes.find((n) => n.id === rootId)
  const origin = rootNode ? rootNode.position : { x: 0, y: 0 }
  positions.set(rootId, { ...origin })

  const rootChildren = childrenMap.get(rootId) ?? []
  const sortedByWeight = [...rootChildren].sort(
    (a, b) => (leafMemo.get(b) ?? 1) - (leafMemo.get(a) ?? 1),
  )
  const leftGroup: string[] = []
  const rightGroup: string[] = []
  let leftWeight = 0
  let rightWeight = 0
  for (const child of sortedByWeight) {
    const weight = leafMemo.get(child) ?? 1
    if (leftWeight <= rightWeight) {
      leftGroup.push(child)
      leftWeight += weight
    } else {
      rightGroup.push(child)
      rightWeight += weight
    }
  }

  function placeSide(group: string[], direction: 1 | -1, totalWeight: number) {
    let cursor = -totalWeight / 2
    function place(nodeId: string, depth: number): number {
      const children = childrenMap.get(nodeId) ?? []
      if (children.length === 0) {
        const y = origin.y + cursor * TREE_Y_STEP
        cursor += 1
        positions.set(nodeId, { x: origin.x + direction * depth * TREE_X_STEP, y })
        return y
      }
      const childYs = children.map((c) => place(c, depth + 1))
      const y = childYs.reduce((a, b) => a + b, 0) / childYs.length
      positions.set(nodeId, { x: origin.x + direction * depth * TREE_X_STEP, y })
      return y
    }
    for (const child of group) place(child, 1)
  }

  placeSide(rightGroup, 1, rightWeight)
  placeSide(leftGroup, -1, leftWeight)

  return positions
}

export function computeMindMapLayoutByStyle(
  style: MindMapLayoutStyle,
  nodes: AnyStepNode[],
  edges: Edge[],
  rootId: string,
): Positions {
  switch (style) {
    case 'radial':
      return computeRadialLayout(nodes, edges, rootId)
    case 'vertical':
      return computeVerticalTreeLayout(nodes, edges, rootId)
    case 'balanced':
      return computeBalancedLayout(nodes, edges, rootId)
    case 'tree':
    default:
      return computeTreeLayout(nodes, edges, rootId)
  }
}

export function recomputeEdgeHandles(
  edges: Edge[],
  positions: Positions,
  fallbackNodes: AnyStepNode[],
): Edge[] {
  return edges.map((e) => {
    const sourcePos = positions.get(e.source) ?? fallbackNodes.find((n) => n.id === e.source)?.position
    const targetPos = positions.get(e.target) ?? fallbackNodes.find((n) => n.id === e.target)?.position
    if (!sourcePos || !targetPos) return e
    const angleDeg =
      (Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x) * 180) / Math.PI
    const sourceHandle = angleToHandle(angleDeg)
    const targetHandle = OPPOSITE_HANDLE[sourceHandle]
    return { ...e, sourceHandle, targetHandle }
  })
}

export interface CollapseVisibility {
  hiddenIds: Set<string>
  childCounts: Map<string, number>
  descendantCounts: Map<string, number>
}

function countDescendants(
  nodeId: string,
  childrenMap: Map<string, string[]>,
  memo: Map<string, number>,
): number {
  if (memo.has(nodeId)) return memo.get(nodeId)!
  const children = childrenMap.get(nodeId) ?? []
  const count = children.reduce((sum, c) => sum + 1 + countDescendants(c, childrenMap, memo), 0)
  memo.set(nodeId, count)
  return count
}

export function computeCollapseVisibility(nodes: AnyStepNode[], edges: Edge[]): CollapseVisibility {
  const childrenMap = buildChildrenMap(nodes, edges)
  const childCounts = new Map<string, number>()
  for (const [nodeId, children] of childrenMap) childCounts.set(nodeId, children.length)

  const descendantCounts = new Map<string, number>()
  for (const n of nodes) countDescendants(n.id, childrenMap, descendantCounts)

  const hiddenIds = new Set<string>()
  function hideSubtree(nodeId: string) {
    for (const child of childrenMap.get(nodeId) ?? []) {
      if (!hiddenIds.has(child)) {
        hiddenIds.add(child)
        hideSubtree(child)
      }
    }
  }
  for (const n of nodes) {
    if ((n.data as MindMapNodeData).collapsed) hideSubtree(n.id)
  }

  return { hiddenIds, childCounts, descendantCounts }
}
