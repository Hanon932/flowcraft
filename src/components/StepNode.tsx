import { memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position, type NodeProps } from 'reactflow'
import { BRANCH_COLORS } from '../lib/palette'
import { useClickOutside } from '../lib/useClickOutside'
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
  rectangle: 'min-w-[160px] max-w-[220px] rounded-2xl border-2 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
  oval: 'min-w-[160px] max-w-[220px] rounded-full border-2 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
  diamond: 'flex items-center justify-center min-w-[200px] max-w-[240px] min-h-[130px]',
  parallelogram: 'flex items-center justify-center min-w-[180px] max-w-[240px] min-h-[70px]',
}

const SHAPE_BORDER_CLASS = {
  selected: 'border-[#0071e3] shadow-[0_0_0_4px_rgba(0,113,227,0.12)]',
  idle: 'border-[#d2d2d7]',
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

function autoResizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

const handleClass =
  '!h-2.5 !w-2.5 !border-2 !border-white !bg-[#0071e3] opacity-0 transition-opacity duration-150 group-hover:opacity-100'

function StepNode({ id, data, selected }: NodeProps<StepData>) {
  const mode = useFlowStore((s) => s.mode)
  const addConnectedStep = useFlowStore((s) => s.addConnectedStep)
  const updateStep = useFlowStore((s) => s.updateStep)
  const editRequestNodeId = useFlowStore((s) => s.editRequestNodeId)
  const clearEditRequest = useFlowStore((s) => s.clearEditRequest)
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const titleInputRef = useRef<HTMLTextAreaElement>(null)
  const [hoverSide, setHoverSide] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null)
  useClickOutside(Boolean(contextMenuPos), () => setContextMenuPos(null), [contextMenuRef])

  useEffect(() => {
    if (editingTitle && titleInputRef.current) autoResizeTextarea(titleInputRef.current)
  }, [editingTitle, data.title])

  function handlePointerMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const distances = {
      top: y,
      bottom: rect.height - y,
      left: x,
      right: rect.width - x,
    } as const
    const nearest = (Object.keys(distances) as (keyof typeof distances)[]).reduce((a, b) =>
      distances[a] <= distances[b] ? a : b,
    )
    setHoverSide(nearest)
  }

  useEffect(() => {
    if (editRequestNodeId === id) {
      setEditingTitle(true)
      clearEditRequest()
    }
  }, [editRequestNodeId, id, clearEditRequest])

  const shape = data.shape ?? 'rectangle'
  const color = data.color
  const fillColor = color ? `${color}26` : undefined
  const isEdit = mode === 'edit'
  const polygonPoints = SHAPE_POLYGON_POINTS[shape]

  return (
    <div
      className="group relative"
      onMouseMove={isEdit ? handlePointerMove : undefined}
      onMouseLeave={() => setHoverSide(null)}
    >
      <div
        onContextMenu={(e) => {
          if (!isEdit) return
          e.preventDefault()
          e.stopPropagation()
          setContextMenuPos({ x: e.clientX, y: e.clientY })
        }}
        className={`relative transition-colors duration-200 ${SHAPE_BOX_CLASS[shape]} ${
          polygonPoints ? '' : selected ? SHAPE_BORDER_CLASS.selected : SHAPE_BORDER_CLASS.idle
        }`}
        style={{
          ...(!polygonPoints && !selected && color ? { borderColor: color } : undefined),
          ...(!polygonPoints && fillColor ? { backgroundColor: fillColor } : undefined),
        }}
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
              style={{
                ...(!selected && color ? { stroke: color } : undefined),
                ...(fillColor ? { fill: fillColor } : undefined),
              }}
              className={`fill-white ${selected ? 'stroke-[#0071e3]' : 'stroke-[#d2d2d7]'}`}
            />
          </svg>
        )}

        <div className={`relative text-center ${SHAPE_CONTENT_PADDING[shape]}`}>
          {editingTitle ? (
            <textarea
              ref={titleInputRef}
              autoFocus
              rows={1}
              value={data.title}
              onChange={(e) => updateStep(id, { title: e.target.value })}
              onFocus={(e) => e.target.select()}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Escape') {
                  e.currentTarget.blur()
                  return
                }
                if (e.key === 'Enter' && e.altKey) {
                  e.preventDefault()
                  document.execCommand('insertText', false, '\n')
                  return
                }
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full resize-none overflow-hidden rounded-md bg-white text-center text-sm font-semibold tracking-tight text-[#1d1d1f] outline-none ring-1 ring-[#0071e3]"
            />
          ) : (
            <div
              onDoubleClick={(e) => {
                if (!isEdit) return
                e.stopPropagation()
                setEditingTitle(true)
              }}
              className="whitespace-pre-wrap text-sm font-semibold tracking-tight text-[#1d1d1f]"
            >
              {data.title || '(無題のステップ)'}
            </div>
          )}
          {data.manual && (
            <div className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-[#86868b]">{data.manual}</div>
          )}
        </div>

        {/* 各辺に target 用（描画位置の計算専用）と source 用（実際のクリックを受け取る）を
            重ねて配置している。type=target 同士の接続はライブラリ側で弾かれるため、
            クリックを受け取る手前側は常に source にして、どの向きでも接続できるようにする。 */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className={`!z-10 ${handleClass}`}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          isConnectableStart
          isConnectableEnd
          className={`!z-10 ${handleClass}`}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className={`!z-10 ${handleClass}`}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          isConnectableStart
          isConnectableEnd
          className={`!z-10 ${handleClass}`}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          className={`!z-10 ${handleClass}`}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          isConnectableStart
          isConnectableEnd
          className={`!z-10 ${handleClass}`}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          className={`!z-10 ${handleClass}`}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          isConnectableStart
          isConnectableEnd
          className={`!z-10 ${handleClass}`}
        />
      </div>

      {isEdit && (
        <>
          {/* 上に次のステップを追加するボタン（中央の接続ハンドルを避けて少し左に配置） */}
          <button
            type="button"
            title="上に接続したステップを追加"
            onClick={(e) => {
              e.stopPropagation()
              addConnectedStep(id, 'above')
            }}
            className={`absolute bottom-full left-1/2 z-10 flex h-4 w-4 -translate-x-[22px] translate-y-1 items-center justify-center rounded-full bg-white text-[10px] font-bold leading-none text-[#0071e3] shadow-sm ring-1 ring-[#d2d2d7] transition-opacity duration-150 hover:bg-[#0071e3] hover:text-white ${
              hoverSide === 'top' ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            +
          </button>

          {/* 下に次のステップを追加するボタン（中央の接続ハンドルを避けて少し左に配置） */}
          <button
            type="button"
            title="下に接続したステップを追加"
            onClick={(e) => {
              e.stopPropagation()
              addConnectedStep(id, 'below')
            }}
            className={`absolute top-full left-1/2 z-10 flex h-4 w-4 -translate-x-[22px] -translate-y-1 items-center justify-center rounded-full bg-white text-[10px] font-bold leading-none text-[#0071e3] shadow-sm ring-1 ring-[#d2d2d7] transition-opacity duration-150 hover:bg-[#0071e3] hover:text-white ${
              hoverSide === 'bottom' ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            +
          </button>

          {/* 左に次のステップを追加するボタン（中央の接続ハンドルを避けて少し上に配置） */}
          <button
            type="button"
            title="左に接続したステップを追加"
            onClick={(e) => {
              e.stopPropagation()
              addConnectedStep(id, 'left')
            }}
            className={`absolute right-full top-1/2 z-10 flex h-4 w-4 translate-x-1 -translate-y-[22px] items-center justify-center rounded-full bg-white text-[10px] font-bold leading-none text-[#0071e3] shadow-sm ring-1 ring-[#d2d2d7] transition-opacity duration-150 hover:bg-[#0071e3] hover:text-white ${
              hoverSide === 'left' ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            +
          </button>

          {/* 右に次のステップを追加するボタン（中央の接続ハンドルを避けて少し上に配置） */}
          <button
            type="button"
            title="右に接続したステップを追加"
            onClick={(e) => {
              e.stopPropagation()
              addConnectedStep(id, 'right')
            }}
            className={`absolute left-full top-1/2 z-10 flex h-4 w-4 -translate-x-1 -translate-y-[22px] items-center justify-center rounded-full bg-white text-[10px] font-bold leading-none text-[#0071e3] shadow-sm ring-1 ring-[#d2d2d7] transition-opacity duration-150 hover:bg-[#0071e3] hover:text-white ${
              hoverSide === 'right' ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            +
          </button>
        </>
      )}

      {contextMenuPos &&
        createPortal(
          <div
            ref={contextMenuRef}
            style={{ position: 'fixed', top: contextMenuPos.y, left: contextMenuPos.x, zIndex: 9999 }}
            className="w-44 rounded-xl bg-white p-1 shadow-lg ring-1 ring-[#d2d2d7]"
          >
            <div className="px-2 py-1 text-[10px] font-medium text-[#86868b]">図形を変更</div>
            {(Object.keys(SHAPE_LABELS) as StepShape[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  updateStep(id, { shape: s })
                  setContextMenuPos(null)
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs hover:bg-[#0071e3]/10 ${
                  shape === s ? 'text-[#0071e3]' : 'text-[#86868b]'
                }`}
              >
                <span>{SHAPE_ICONS[s]}</span>
                <span>{SHAPE_LABELS[s]}</span>
              </button>
            ))}

            <div className="mt-1 border-t border-[#d2d2d7] pt-1">
              <div className="px-2 py-1 text-[10px] font-medium text-[#86868b]">色を変更</div>
              <div className="grid grid-cols-5 gap-1 px-2 pb-1">
                <button
                  type="button"
                  title="デフォルト"
                  onClick={(e) => {
                    e.stopPropagation()
                    updateStep(id, { color: undefined })
                    setContextMenuPos(null)
                  }}
                  className={`flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-[#86868b] ring-1 ${
                    !color ? 'ring-2 ring-[#0071e3]' : 'ring-[#d2d2d7]'
                  }`}
                >
                  ×
                </button>
                {BRANCH_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateStep(id, { color: c })
                      setContextMenuPos(null)
                    }}
                    className={`h-5 w-5 rounded-full ring-1 ${
                      color === c ? 'ring-2 ring-[#0071e3]' : 'ring-[#d2d2d7]'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default memo(StepNode)
