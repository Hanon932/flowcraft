import { useState } from 'react'
import { findReflectionsFile, loadReflectionsFromDrive, saveReflectionsToDrive } from '../lib/googleDrive'
import { useDriveAutoSave } from '../lib/useDriveAutoSave'
import { useGoalProfileStore, useReflectionStore } from '../store'
import GoalRoadmapPanel from './GoalRoadmapPanel'
import MonthlyGoalPanel from './MonthlyGoalPanel'
import ReflectionCalendar from './ReflectionCalendar'

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

const TABS: { key: 'daily' | 'roadmap' | 'pdca'; label: string }[] = [
  { key: 'daily', label: '日次振り返り' },
  { key: 'roadmap', label: '🎯 目標ロードマップ' },
  { key: 'pdca', label: '月間PDCA' },
]

export default function ReflectionPanel() {
  const [tab, setTab] = useState<'daily' | 'roadmap' | 'pdca'>('daily')
  const goalTitle = useGoalProfileStore((s) => s.title)
  const today = toDateKey(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })

  const entries = useReflectionStore((s) => s.entries)
  const upsertEntry = useReflectionStore((s) => s.upsertEntry)
  const deleteEntry = useReflectionStore((s) => s.deleteEntry)
  const driveFileId = useReflectionStore((s) => s.driveFileId)
  const setDriveFileId = useReflectionStore((s) => s.setDriveFileId)
  const mergeFromDrive = useReflectionStore((s) => s.mergeFromDrive)
  const [driveStatus, setDriveStatus] = useState<string | null>(null)
  const [driveBusy, setDriveBusy] = useState(false)

  const entry = entries.find((e) => e.date === selectedDate)
  const history = [...entries]
    .filter((e) => e.problem.trim() || e.improvement.trim())
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const entryDates = new Set(history.map((e) => e.date))

  function selectDate(dateKey: string) {
    setSelectedDate(dateKey)
    const [y, m] = dateKey.split('-').map(Number)
    setCalendarMonth({ year: y, month: m })
  }

  function jumpToDaily(dateKey: string) {
    selectDate(dateKey)
    setTab('daily')
  }

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

  useDriveAutoSave(Boolean(driveFileId), entries, handleDriveSave)

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl min-h-0 flex-col p-6">
      <div className="mb-4 flex gap-1 rounded-full bg-[#f5f5f7] p-0.5 text-xs w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 transition-colors duration-200 ${
              tab === t.key
                ? 'bg-white font-medium text-[#0071e3] shadow-sm'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pdca' ? (
        <MonthlyGoalPanel onJumpToDate={jumpToDaily} />
      ) : tab === 'roadmap' ? (
        <GoalRoadmapPanel onJumpToDate={jumpToDaily} />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => selectDate(addDays(selectedDate, -1))}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.03]"
                title="前の日"
              >
                ‹
              </button>
              <span className="w-44 text-center text-sm font-semibold tracking-tight text-[#1d1d1f]">
                {formatDateLabel(selectedDate)}
              </span>
              <button
                type="button"
                onClick={() => selectDate(addDays(selectedDate, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.03]"
                title="次の日"
              >
                ›
              </button>
              {selectedDate !== today && (
                <button
                  type="button"
                  onClick={() => selectDate(today)}
                  className="ml-1 rounded-full px-3 py-1.5 text-xs text-[#0071e3] hover:bg-[#0071e3]/10"
                >
                  今日に戻る
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

          <div className="flex min-h-0 flex-1 gap-6">
            <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
              {goalTitle && (
                <div className="flex flex-col">
                  <label className="mb-1.5 text-xs font-medium text-[#86868b]">
                    🎯 「{goalTitle}」に向けて取り組んだこと
                  </label>
                  <textarea
                    value={entry?.goalAction ?? ''}
                    onChange={(e) => upsertEntry(selectedDate, { goalAction: e.target.value })}
                    placeholder="今日、目標に近づくためにやったことを書きましょう"
                    className="h-24 w-full resize-none rounded-xl bg-[#0071e3]/5 p-3 text-sm leading-relaxed text-[#1d1d1f] outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
                  />
                </div>
              )}
              <div className="flex flex-col">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-[#86868b]">反省点</label>
                  {entry && (entry.problem || entry.improvement) && (
                    <span className="text-[11px] text-[#c7c7cc]">
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
                  className="h-40 w-full resize-none rounded-xl bg-[#f5f5f7] p-3 text-sm leading-relaxed text-[#1d1d1f] outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1.5 text-xs font-medium text-[#86868b]">改善点</label>
                <textarea
                  value={entry?.improvement ?? ''}
                  onChange={(e) => upsertEntry(selectedDate, { improvement: e.target.value })}
                  placeholder="次はどう変えるか、具体的なアクションを書きましょう"
                  className="h-40 w-full resize-none rounded-xl bg-[#f5f5f7] p-3 text-sm leading-relaxed text-[#1d1d1f] outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
                />
              </div>
            </div>

            <div className="flex w-64 shrink-0 flex-col overflow-y-auto border-l border-[#d2d2d7] pl-4">
              <ReflectionCalendar
                year={calendarMonth.year}
                month={calendarMonth.month}
                selectedDate={selectedDate}
                todayKey={today}
                hasEntry={(dateKey) => entryDates.has(dateKey)}
                onSelectDate={selectDate}
                onChangeMonth={(year, month) => setCalendarMonth({ year, month })}
              />

              <span className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-[#86868b]">
                履歴
              </span>
              <div className="flex-1 overflow-y-auto">
                {history.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => selectDate(e.date)}
                    className={`group mb-1 cursor-pointer rounded-xl px-3 py-2 text-xs transition-colors duration-200 ${
                      e.date === selectedDate
                        ? 'bg-[#0071e3]/10 text-[#0071e3]'
                        : 'text-[#1d1d1f] hover:bg-black/[0.03]'
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
                        className="ml-1 hidden shrink-0 rounded-full px-1.5 text-[#c7c7cc] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] group-hover:block"
                        title="削除"
                      >
                        ×
                      </button>
                    </div>
                    <p className="mt-0.5 truncate text-[#86868b]">{e.problem || e.improvement}</p>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="px-1 py-4 text-center text-xs text-[#86868b]">
                    まだ記録がありません。
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
