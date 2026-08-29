import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { StepData } from '../types'

function StepNode({ data, selected }: NodeProps<StepData>) {
  return (
    <div
      className={`min-w-[160px] max-w-[220px] rounded-lg border-2 bg-white px-4 py-3 shadow-sm transition-colors dark:bg-neutral-800 ${
        selected
          ? 'border-violet-500 shadow-violet-200 dark:shadow-none'
          : 'border-neutral-300 dark:border-neutral-600'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-violet-500" />
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
      <Handle type="source" position={Position.Bottom} className="!bg-violet-500" />
    </div>
  )
}

export default memo(StepNode)
