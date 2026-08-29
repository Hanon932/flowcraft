import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { useFlowStore } from '../store'
import type { StepData, StepShape } from '../types'

const SHAPE_LABELS: Record<StepShape, string> = {
  rectangle: '四角形',
  oval: '角丸',
  diamond: 'ひし形（分岐）',
  parallelogram: '平行四辺形（入出力）',
}

const SHAPE_ICONS: Record<StepShape, string> = {
  rectangle: '▭',
  oval: '◖◗',
  diamond: '◇',
  parallelogram: '▱',
}

const SHAPE_BOX_CLASS: Record<StepShape, string> = {
  rectangle: 'min-w-[160px] max-w-[220px] rounded-lg border-2 bg-white shadow-sm dark:bg-neutral-800',
  oval: 'min-w-[160px] max-w-[220px] rounded-full border-2 bg-white shadow-sm dark:bg-neutral-800',
  diamond: 'min-w-[200px] max-w-[240px] min-h-[130px]',
  parallelogram: 'min-w-[180px] max-w-[240px] min-h-[70px]',
}

const SHAPE_BORDER_CLASS = {
  selected: 'border-violet-500 shadow-violet-200 dark:shadow-none',
  idle: 'border-neutral-300 dark:border-neutral-600',
}

const SHAPE_POLYGON_POINTS: Partial<Record<StepShape, string>> = {
  diamond: '50,2 98,50 50,98 2,50',
  parallelogram: '16,4 100,4 84,96 0,96',
}

const SHAPE_CONTENT_PADDING: Record<StepShape, string> = {
  rectangle: 'px-4 py-3',
  oval: 'px-6 py-3',
  diamond: 'px-14 py-10',
  parallelogram: 'px-9 py-3',
}

function StepNode({ id, data, selected }: NodeProps<StepData>) {
  const mode = useFlowStore((s) => s.mode)
  const addConnectedStep = useFlowStore((s) => s.addConnectedStep)
  const updateStep = useFlowStore((s) => s.updateStep)
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false)
  const shape = data.shape ?? 'rectangle'
  const isEdit = mode === 'edit'
  const polygonPoints = SHAPE_POLYGON_POINTS[shape]

  return (
    <div className="group relative">
      <div
        className={`relative transition-colors ${SHAPE_BOX_CLASS[shape]} ${
          polygonPoints ? '' : selected ? SHAPE_BORDER_CLASS.selected : SHAPE_BORDER_CLASS.idle
        }`}
      >
        {polygonPoints && (
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              points={polygonPoints}
              vectorEffect="non-scaling-stroke"
              strokeWidth={2}
              className={`fill-white dark:fill-neutral-800 ${
                selected
                  ? 'stroke-violet-500'
                  : 'stroke-neutral-300 dark:stroke-neutral-600'
              }`}
            />
          </svg>
        )}

        <Handle type="target" position={Position.Top} className="!z-10 !bg-violet-500" />

        <div className={`relative z-10 ${SHAPE_CONTENT_PADDING[shape]}`}>
          <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {data.title || '(無題のステップ)'}
          </div>
          {data.manual ? (
            <div className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
              {data.manual}
            </div>
          ) : (
            <div className="mt-1 text-xs italic text-neutral-400">マニュアル未設定</div>
          )}
        </div>

        <Handle type="source" position={Position.Bottom} className="!z-10 !bg-violet-500" />
      </div>

      {isEdit && (
        <>
          {/* 図形切替ボタン */}
          <div className="absolute -left-2 -top-2 z-10">
            <button
              type="button"
              title="図形の種類を変更"
              onClick={(e) => {
                e.stopPropagation()
                setShapeMenuOpen((v) => !v)
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-xs text-neutral-500 opacity-0 shadow-sm transition-opacity hover:bg-neutral-100 group-hover:opacity-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
            >
              ⬡
            </button>
            {shapeMenuOpen && (
              <div className="absolute left-0 top-7 z-20 w-40 rounded border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-800">
                {(Object.keys(SHAPE_LABELS) as StepShape[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateStep(id, { shape: s })
                      setShapeMenuOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-violet-50 dark:hover:bg-violet-900/30 ${
                      shape === s
                        ? 'text-violet-600 dark:text-violet-300'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <span>{SHAPE_ICONS[s]}</span>
                    <span>{SHAPE_LABELS[s]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 下に次のステップを追加するボタン */}
          <button
            type="button"
            title="下に接続したステップを追加"
            onClick={(e) => {
              e.stopPropagation()
              addConnectedStep(id)
            }}
            className="absolute left-1/2 top-full z-10 flex h-6 w-6 -translate-x-1/2 translate-y-2 items-center justify-center rounded-full border border-violet-400 bg-white text-sm font-bold text-violet-500 opacity-0 shadow-sm transition-opacity hover:bg-violet-50 group-hover:opacity-100 dark:bg-neutral-700"
          >
            +
          </button>
        </>
      )}
    </div>
  )
}

export default memo(StepNode)
