import { useState } from 'react'
import { findGoalsFile, loadGoalsFromDrive, saveGoalsToDrive } from '../lib/googleDrive'
import { useDriveAutoSave } from '../lib/useDriveAutoSave'
import { useGoalStore, useReflectionStore } from '../store'

const PDCA_FIELDS: {
  key: 'plan' | 'doPlan' | 'check' | 'act'
  badge: string
  label: string
  placeholder: string
  color: string
}[] = [
  {
    key: 'plan',
    badge: 'P',
    label: 'Plan（計画）',
    placeholder: '今月達成したい目標を書きましょう',
    color: 'bg-[#0071e3]/10 text-[#0071e3]',
  },
  {
    key: 'doPlan',
    badge: 'D',
    label: 'Do（実行）',
    placeholder: '目標達成のために具体的に取り組むことを書きましょう',
    color: 'bg-[#34c759]/10 text-[#248a3d]',
  },
  {
    key: 'check',
    badge: 'C',
    label: 'Check（評価）',
    placeholder: '月末に、目標に対してどうだったか振り返りましょう（日々の反省点も参考に）',
    color: 'bg-[#ff9500]/10 text-[#c76a00]',
  },
  {
    key: 'act',
    badge: 'A',
    label: 'Act（改善）',
    placeholder: '来月にどう活かすか、次のアクションを書きましょう',
    color: 'bg-[#ff3b30]/10 text-[#ff3b30]',
  },
]

function toMonthKey(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, '0')}`
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  return `${y}年${m}月`
}

function formatDayLabel(dateKey: string): string {
  const [, , d] = dateKey.split('-').map(Number)
  return `${d}日`
}

interface MonthlyGoalPanelProps {
  onJumpToDate: (dateKey: string) => void
}

export default function MonthlyGoalPanel({ onJumpToDate }: MonthlyGoalPanelProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const monthKey = toMonthKey(year, month)
  const thisMonthKey = toMonthKey(now.getFullYear(), now.getMonth() + 1)

  const goals = useGoalStore((s) => s.goals)
  const upsertGoal = useGoalStore((s) => s.upsertGoal)
  const driveFileId = useGoalStore((s) => s.driveFileId)
  const setDriveFileId = useGoalStore((s) => s.setDriveFileId)
  const mergeFromDrive = useGoalStore((s) => s.mergeFromDrive)
  const [driveStatus, setDriveStatus] = useState<string | null>(null)
  const [driveBusy, setDriveBusy] = useState(false)

  const reflectionEntries = useReflectionStore((s) => s.entries)
  const monthEntries = reflectionEntries
    .filter((e) => e.date.startsWith(monthKey) && (e.problem.trim() || e.improvement.trim()))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const goal = goals.find((g) => g.month === monthKey)

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
  }
  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  function flashDrive(message: string) {
    setDriveStatus(message)
    setTimeout(() => setDriveStatus(null), 4000)
  }

  async function handleDriveSave() {
    setDriveBusy(true)
    flashDrive('Googleドライブに保存中…')
    try {
      const fileId = await saveGoalsToDrive(useGoalStore.getState().goals, driveFileId)
      setDriveFileId(fileId)
      flashDrive('Googleドライブに保存しました')
    } catch (err) {
      flashDrive(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setDriveBusy(false)
    }
  }

  async function handleDriveLoad() {
    setDriveBusy(true)
    flashDrive('Googleドライブから読み込み中…')
    try {
      const file = driveFileId ? { id: driveFileId } : await findGoalsFile()
      if (!file) {
        flashDrive('Googleドライブに保存された目標が見つかりません。先に「Driveに保存」してください。')
        return
      }
      const remoteGoals = await loadGoalsFromDrive(file.id)
      mergeFromDrive(remoteGoals)
      setDriveFileId(file.id)
      flashDrive('Googleドライブから読み込みました')
    } catch (err) {
      flashDrive(err instanceof Error ? err.message : '読み込みに失敗しました')
    } finally {
      setDriveBusy(false)
    }
  }

  useDriveAutoSave(Boolean(driveFileId), goals, handleDriveSave)

  return (
    <div className="flex min-h-0 flex-1 gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.03]"
              title="前の月"
            >
              ‹
            </button>
            <span className="w-28 text-center text-sm font-semibold tracking-tight text-[#1d1d1f]">
              {formatMonthLabel(monthKey)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.03]"
              title="次の月"
            >
              ›
            </button>
            {monthKey !== thisMonthKey && (
              <button
                type="button"
                onClick={() => {
                  setYear(now.getFullYear())
                  setMonth(now.getMonth() + 1)
                }}
                className="ml-1 rounded-full px-3 py-1.5 text-xs text-[#0071e3] hover:bg-[#0071e3]/10"
              >
                今月に戻る
              </button>
            )}
          </div>

          <div className="relative flex items-center gap-1">
            {driveFileId && (
              <span
                className="flex items-center gap-1 rounded-full bg-[#34c759]/10 px-2.5 py-1 text-[10px] font-medium text-[#248a3d]"
                title="変更すると自動的にGoogleドライブへ保存されます"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#34c759]" />
                自動保存オン
              </span>
            )}
            <button
              type="button"
              onClick={handleDriveSave}
              disabled={driveBusy}
              className="rounded-full px-3 py-1.5 text-xs text-[#86868b] hover:bg-black/[0.03] disabled:opacity-50"
            >
              Driveに保存
            </button>
            <button
              type="button"
              onClick={handleDriveLoad}
              disabled={driveBusy}
              className="rounded-full px-3 py-1.5 text-xs text-[#86868b] hover:bg-black/[0.03] disabled:opacity-50"
            >
              Driveから読み込む
            </button>
            {driveStatus && (
              <div className="absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-full bg-[#1d1d1f]/95 px-3 py-1 text-xs text-white shadow-md">
                {driveStatus}
              </div>
            )}
          </div>
        </div>

        {goal && (goal.plan || goal.doPlan || goal.check || goal.act) && (
          <span className="text-[11px] text-[#c7c7cc]">
            {new Date(goal.updatedAt).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            に自動保存済み
          </span>
        )}

        {PDCA_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#86868b]">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${f.color}`}
              >
                {f.badge}
              </span>
              {f.label}
            </label>
            <textarea
              value={goal?.[f.key] ?? ''}
              onChange={(e) => upsertGoal(monthKey, { [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="h-24 w-full resize-none rounded-xl bg-[#f5f5f7] p-3 text-sm leading-relaxed text-[#1d1d1f] outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
            />
          </div>
        ))}
      </div>

      <div className="flex w-56 shrink-0 flex-col border-l border-[#d2d2d7] pl-4">
        <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#86868b]">
          この月の日次振り返り
        </span>
        <div className="flex-1 overflow-y-auto">
          {monthEntries.map((e) => (
            <div
              key={e.id}
              onClick={() => onJumpToDate(e.date)}
              className="group mb-1 cursor-pointer rounded-xl px-3 py-2 text-xs text-[#1d1d1f] transition-colors duration-200 hover:bg-black/[0.03]"
            >
              <span className="font-medium">{formatDayLabel(e.date)}</span>
              <p className="mt-0.5 truncate text-[#86868b]">{e.problem || e.improvement}</p>
            </div>
          ))}
          {monthEntries.length === 0 && (
            <p className="px-1 py-4 text-center text-xs text-[#86868b]">
              この月の記録はまだありません。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
