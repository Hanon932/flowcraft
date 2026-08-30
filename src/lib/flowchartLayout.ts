import type { Edge } from 'reactflow'
import type { AnyStepNode } from '../types'

const X_STEP = 260
const Y_STEP = 160

export function computeFlowchartLayout(
  nodes: AnyStepNode[],
  edges: Edge[],
): Map<string, { x: number; y: number }> {
  const ids = nodes.map((n) => n.id)
  const childrenMap = new Map<string, string[]>()
  const hasIncoming = new Set<string>()
  for (const id of ids) childrenMap.set(id, [])
  for (const e of edges) {
    if (childrenMap.has(e.source) && childrenMap.has(e.target)) {
      childrenMap.get(e.source)!.push(e.target)
      hasIncoming.add(e.target)
    }
  }

  const layer = new Map<string, number>()
  const roots = ids.filter((id) => !hasIncoming.has(id))
  for (const r of roots.length > 0 ? roots : ids.slice(0, 1)) layer.set(r, 0)

  // Bounded relaxation so cyclic flowcharts (loop-back steps) can't spin forever.
  for (let pass = 0; pass < ids.length + 1; pass++) {
    let changed = false
    for (const id of ids) {
      if (!layer.has(id)) continue
      const currentLayer = layer.get(id)!
      for (const child of childrenMap.get(id) ?? []) {
        const proposed = currentLayer + 1
        if (proposed <= ids.length && (!layer.has(child) || layer.get(child)! < proposed)) {
          layer.set(child, proposed)
          changed = true
        }
      }
    }
    if (!changed) break
  }
  for (const id of ids) if (!layer.has(id)) layer.set(id, 0)

  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const byLayer = new Map<number, string[]>()
  for (const id of ids) {
    const l = layer.get(id)!
    if (!byLayer.has(l)) byLayer.set(l, [])
    byLayer.get(l)!.push(id)
  }

  const positions = new Map<string, { x: number; y: number }>()
  for (const [l, idsInLayer] of byLayer) {
    idsInLayer.sort((a, b) => (nodeById.get(a)?.position.x ?? 0) - (nodeById.get(b)?.position.x ?? 0))
    const totalWidth = (idsInLayer.length - 1) * X_STEP
    idsInLayer.forEach((id, i) => {
      positions.set(id, { x: i * X_STEP - totalWidth / 2, y: l * Y_STEP })
    })
  }

  return positions
}
