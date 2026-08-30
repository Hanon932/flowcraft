import { memo, useEffect, useState } from 'react'
import { Handle, NodeResizer, Position, type NodeProps } from 'reactflow'
import { BRANCH_COLORS } from '../lib/palette'
import { useFlowStore } from '../store'
import type { FreeShape, FreeShapeData } from '../types'

const SHAPE_LABELS: Record<FreeShape, string> = {
  rectangle: '四角形',
  oval: '角丸',
  diamond: 'ひし形',
  parallelogram: '平行四辺形',
}

const SHAPE_ICONS: Record<FreeShape, string> = {
  rectangle: '▭',
  oval: '◖◗',
  diamond: '◇',
  parallelogram: '▱',
}

const SHAPE_ROUNDED_CLASS: Record<FreeShape, string> = {
  rectangle: 'rounded-2xl',
  oval: 'rounded-full',
  diamond: '',
  parallelogram: '',
}

const SHAPE_POLYGON_POINTS: Partial<Record<FreeShape, string>> = {
  diamond: '50,2 98,50 50,98 2,50',
  parallelogram: '16,4 100,4 84,96 0,96',
}

const SHAPE_CONTENT_PADDING: Record<FreeShape, string> = {
  rectangle: 'p-3',
  oval: 'p-4',
  diamond: 'px-10 py-9',
  parallelogram: 'px-9 py-3',
}

const handleClass =
  'h-2 w-2 !border-2 !border-white !bg-sky-500 opacity-0 transition-opacity group-hover:opacity-100'

function FreeShapeNode({ id, data, selected }: NodeProps<FreeShapeData>) {
  const mode = useFlowStore((s) => s.mode)
  const updateStep = useFlowStore((s) => s.updateStep)
  const deleteStep = useFlowStore((s) => s.deleteStep)
  const [editing, setEditing] = useState(false)
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false)
  const [colorMenuOpen, setColorMenuOpen] = useState(false)
  const isEdit = mode === 'edit'
  const shape = data.shape
  const color = data.color ?? '#0ea5e9'
  const polygonPoints = SHAPE_POLYGON_POINTS[shape]

  useEffect(() => {
    if (selected && data.text === '' && isEdit) {
      setEditing(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  return (
    <div className="group relative h-full w-full">
      <NodeResizer
        isVisible={isEdit && Boolean(selected)}
        minWidth={80}
        minHeight={50}
        handleStyle={{ width: 10, height: 10, borderRadius: 9999, border: '2px solid white' }}
        lineStyle={{ borderColor: '#38bdf8' }}
      />

      <Handle type="target" position={Position.Top} id="top" isConnectableStart isConnectableEnd className={handleClass} />
      <Handle type="source" position={Position.Right} id="right" isConnectableStart isConnectableEnd className={handleClass} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectableStart isConnectableEnd className={handleClass} />
      <Handle type="source" position={Position.Left} id="left" isConnectableStart isConnectableEnd className={handleClass} />

      <div
        className={`relative h-full w-full bg-white shadow-sm ${SHAPE_ROUNDED_CLASS[shape]} ${
          polygonPoints ? '' : 'border-2'
        } ${selected ? 'ring-2 ring-sky-400' : ''}`}
        style={!polygonPoints ? { borderColor: color } : undefined}
      >
        {polygonPoints && (
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon
              points={polygonPoints}
              vectorEffect="non-scaling-stroke"
              strokeWidth={2}
              style={{ stroke: color }}
              className={`fill-white ${selected ? '!stroke-sky-400' : ''}`}
            />
          </svg>
        )}

        <div
          className={`relative z-10 flex h-full w-full items-center justify-center text-center ${SHAPE_CONTENT_PADDING[shape]}`}
        >
          {editing ? (
            <textarea
              autoFocus
              value={data.text}
              onChange={(e) => updateStep(id, { text: e.target.value })}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') e.currentTarget.blur()
              }}
              className="h-full w-full resize-none bg-transparent text-center text-sm font-medium text-neutral-800 outline-none"
            />
          ) : (
            <div
              onDoubleClick={() => isEdit && setEditing(true)}
              className="w-full whitespace-pre-wrap break-words text-sm font-medium text-neutral-700"
            >
              {data.text || 'テキスト'}
            </div>
          )}
        </div>
      </div>

      {isEdit && (
        <>
          <div className="absolute -left-2 -top-2 z-10">
            <button
              type="button"
              title="図形の種類を変更"
              onClick={(e) => {
                e.stopPropagation()
                setShapeMenuOpen((v) => !v)
                setColorMenuOpen(false)
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-neutral-400 opacity-0 shadow-md ring-1 ring-neutral-200 transition-opacity hover:text-sky-500 group-hover:opacity-100"
            >
              ⬡
            </button>
            {shapeMenuOpen && (
              <div className="absolute left-0 top-7 z-20 w-36 rounded-xl bg-white p-1 shadow-lg ring-1 ring-neutral-200">
                {(Object.keys(SHAPE_LABELS) as FreeShape[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateStep(id, { shape: s })
                      setShapeMenuOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs hover:bg-sky-50 ${
                      shape === s ? 'text-sky-600' : 'text-neutral-500'
                    }`}
                  >
                    <span>{SHAPE_ICONS[s]}</span>
                    <span>{SHAPE_LABELS[s]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="absolute -right-2 -top-2 z-10">
            <button
              type="button"
              title="色を変更"
              onClick={(e) => {
                e.stopPropagation()
                setColorMenuOpen((v) => !v)
                setShapeMenuOpen(false)
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white opacity-0 shadow-md ring-1 ring-neutral-200 transition-opacity group-hover:opacity-100"
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            </button>
            {colorMenuOpen && (
              <div className="absolute right-0 top-7 z-20 grid w-32 grid-cols-4 gap-1 rounded-xl bg-white p-2 shadow-lg ring-1 ring-neutral-200">
                {BRANCH_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateStep(id, { color: c })
                      setColorMenuOpen(false)
                    }}
                    className="h-5 w-5 rounded-full ring-1 ring-neutral-200"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            title="削除"
            onClick={(e) => {
              e.stopPropagation()
              deleteStep(id)
            }}
            className="absolute -bottom-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-neutral-400 opacity-0 shadow-md ring-1 ring-neutral-200 transition-opacity hover:text-red-500 group-hover:opacity-100"
          >
            ×
          </button>
        </>
      )}
    </div>
  )
}

export default memo(FreeShapeNode)
