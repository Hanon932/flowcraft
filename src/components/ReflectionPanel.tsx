import { useState } from 'react'
import { findReflectionsFile, loadReflectionsFromDrive, saveReflectionsToDrive } from '../lib/googleDrive'
import { useReflectionStore } from '../store'

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  return `${y}年${m}月${d}日(${weekday})`
}

function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d + delta)
  return toDateKey(date)
}

export default function ReflectionPanel() {
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const entries = useReflectionStore((s) => s.entries)
  const upsertEntry = useReflectionStore((s) => s.upsertEntry)
  const deleteEntry = useReflectionStore((s) => s.deleteEntry)
  const driveFileId = useReflectionStore((s) => s.driveFileId)
  const setDriveFileId = useReflectionStore((s) => s.setDriveFileId)
  const mergeFromDrive = useReflectionStore((s) => s.mergeFromDrive)
  const [driveStatus, setDriveStatus] = useState<string | null>(null)
  const [driveBusy, setDriveBusy] = useState(false)

  const entry = entries.find((e) => e.date === selectedDate)
  const today = toDateKey(new Date())
  const history = [...entries]
    .filter((e) => e.problem.trim() || e.improvement.trim())
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  function flashDrive(message: string) {
    setDriveStatus(message)
    setTimeout(() => setDriveStatus(null), 4000)
  }

  async function handleDriveSave() {
    setDriveBusy(true)
    flashDrive('Googleドライブに保存中…')
    try {
      const fileId = await saveReflectionsToDrive(useReflectionStore.getState().entries, driveFileId)
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
      const file = driveFileId ? { id: driveFileId } : await findReflectionsFile()
      if (!file) {
        flashDrive('Googleドライブに保存された振り返りが見つかりません。先に「Driveに保存」してください。')
        return
      }
      const remoteEntries = await loadReflectionsFromDrive(file.id)
      mergeFromDrive(remoteEntries)
      setDriveFileId(file.id)
      flashDrive('Googleドライブから読み込みました')
    } catch (err) {
      flashDrive(err instanceof Error ? err.message : '読み込みに失敗しました')
    } finally {
      setDriveBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl min-h-0 flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
            title="前の日"
          >
            ‹
          </button>
          <span className="w-44 text-center text-sm font-semibold text-neutral-800">
            {formatDateLabel(selectedDate)}
          </span>
          <button
            type="button"
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
            title="次の日"
          >
            ›
          </button>
          {selectedDate !== today && (
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className="ml-1 rounded-full px-3 py-1.5 text-xs text-sky-600 hover:bg-sky-50"
            >
              今日に戻る
            </button>
          )}
        </div>

        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={handleDriveSave}
            disabled={driveBusy}
            className="rounded-full px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          >
            Driveに保存
          </button>
          <button
            type="button"
            onClick={handleDriveLoad}
            disabled={driveBusy}
            className="rounded-full px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          >
            Driveから読み込む
          </button>
          {driveStatus && (
            <div className="absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-full bg-neutral-800/90 px-3 py-1 text-xs text-white shadow-md">
              {driveStatus}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-400">反省点</label>
              {entry && (entry.problem || entry.improvement) && (
                <span className="text-[11px] text-neutral-300">
                  {new Date(entry.updatedAt).toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  に自動保存済み
                </span>
              )}
            </div>
            <textarea
              value={entry?.problem ?? ''}
              onChange={(e) => upsertEntry(selectedDate, { problem: e.target.value })}
              placeholder="うまくいかなかったこと、気づいた課題を書きましょう"
              className="h-40 w-full resize-none rounded-xl bg-neutral-100 p-3 text-sm leading-relaxed outline-none ring-1 ring-transparent focus:bg-white focus:ring-sky-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1.5 text-xs font-medium text-neutral-400">改善点</label>
            <textarea
              value={entry?.improvement ?? ''}
              onChange={(e) => upsertEntry(selectedDate, { improvement: e.target.value })}
              placeholder="次はどう変えるか、具体的なアクションを書きましょう"
              className="h-40 w-full resize-none rounded-xl bg-neutral-100 p-3 text-sm leading-relaxed outline-none ring-1 ring-transparent focus:bg-white focus:ring-sky-400"
            />
          </div>
        </div>

        <div className="flex w-56 shrink-0 flex-col border-l border-neutral-100 pl-4">
          <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            履歴
          </span>
          <div className="flex-1 overflow-y-auto">
            {history.map((e) => (
              <div
                key={e.id}
                onClick={() => setSelectedDate(e.date)}
                className={`group mb-1 cursor-pointer rounded-xl px-3 py-2 text-xs transition-colors ${
                  e.date === selectedDate
                    ? 'bg-sky-50 text-sky-600'
                    : 'text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatDateLabel(e.date)}</span>
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      if (confirm(`${formatDateLabel(e.date)}の記録を削除しますか？`)) {
                        deleteEntry(e.id)
                      }
                    }}
                    className="ml-1 hidden shrink-0 rounded-full px-1.5 text-neutral-300 hover:bg-red-50 hover:text-red-500 group-hover:block"
                    title="削除"
                  >
                    ×
                  </button>
                </div>
                <p className="mt-0.5 truncate text-neutral-400">
                  {e.problem || e.improvement}
                </p>
              </div>
            ))}
            {history.length === 0 && (
              <p className="px-1 py-4 text-center text-xs text-neutral-300">
                まだ記録がありません。
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
