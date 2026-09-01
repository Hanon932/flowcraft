import { useState } from 'react'
import {
  findGoalProfileFile,
  loadGoalProfileFromDrive,
  saveGoalProfileToDrive,
} from '../lib/googleDrive'
import { useDriveAutoSave } from '../lib/useDriveAutoSave'
import { useFlowStore, useGoalProfileStore, useReflectionStore, useUiStore } from '../store'

function formatDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][new Date(y, m - 1, d).getDay()]
  return `${m}月${d}日(${weekday})`
}

export default function GoalRoadmapPanel({ onJumpToDate }: { onJumpToDate: (dateKey: string) => void }) {
  const title = useGoalProfileStore((s) => s.title)
  const why = useGoalProfileStore((s) => s.why)
  const roadmapDocId = useGoalProfileStore((s) => s.roadmapDocId)
  const driveFileId = useGoalProfileStore((s) => s.driveFileId)
  const setGoal = useGoalProfileStore((s) => s.setGoal)
  const setRoadmapDocId = useGoalProfileStore((s) => s.setRoadmapDocId)
  const setDriveFileId = useGoalProfileStore((s) => s.setDriveFileId)
  const mergeFromDrive = useGoalProfileStore((s) => s.mergeFromDrive)

  const docs = useFlowStore((s) => s.docs)
  const createGoalRoadmap = useFlowStore((s) => s.createGoalRoadmap)
  const setActiveId = useFlowStore((s) => s.setActiveId)
  const setSection = useUiStore((s) => s.setSection)

  const reflectionEntries = useReflectionStore((s) => s.entries)
  const actionLog = [...reflectionEntries]
    .filter((e) => (e.goalAction ?? '').trim())
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 14)

  const [driveStatus, setDriveStatus] = useState<string | null>(null)
  const [driveBusy, setDriveBusy] = useState(false)

  const roadmapDoc = docs.find((d) => d.id === roadmapDocId)
  const milestoneNodes = (roadmapDoc?.nodes ?? []).filter((n) => !(n.data as { root?: boolean }).root)
  const total = milestoneNodes.length

  function flashDrive(message: string) {
    setDriveStatus(message)
    setTimeout(() => setDriveStatus(null), 4000)
  }

  async function handleDriveSave() {
    setDriveBusy(true)
    flashDrive('Googleドライブに保存中…')
    try {
      const state = useGoalProfileStore.getState()
      const fileId = await saveGoalProfileToDrive(
        { title: state.title, why: state.why, roadmapDocId: state.roadmapDocId, updatedAt: state.updatedAt },
        driveFileId,
      )
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
      const file = driveFileId ? { id: driveFileId } : await findGoalProfileFile()
      if (!file) {
        flashDrive('Googleドライブに保存された目標が見つかりません。先に「Driveに保存」してください。')
        return
      }
      const remote = await loadGoalProfileFromDrive(file.id)
      mergeFromDrive(remote)
      setDriveFileId(file.id)
      flashDrive('Googleドライブから読み込みました')
    } catch (err) {
      flashDrive(err instanceof Error ? err.message : '読み込みに失敗しました')
    } finally {
      setDriveBusy(false)
    }
  }

  useDriveAutoSave(Boolean(driveFileId), { title, why, roadmapDocId }, handleDriveSave)

  function handleCreateRoadmap() {
    const docId = createGoalRoadmap(title || '目標')
    setRoadmapDocId(docId)
    setSection('mindmap')
  }

  function handleOpenRoadmap() {
    if (!roadmapDoc) return
    setActiveId(roadmapDoc.id)
    setSection('mindmap')
  }

  return (
    <div className="flex min-h-0 flex-1 gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto">
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-[#86868b]">🎯 目標</label>
            <input
              value={title}
              onChange={(e) => setGoal({ title: e.target.value })}
              placeholder="例）主任になる"
              className="w-full rounded-xl bg-[#f5f5f7] px-3 py-2 text-lg font-semibold tracking-tight text-[#1d1d1f] outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
            />
          </div>
          <div className="relative ml-3 mt-5 flex items-center gap-1">
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

        <div>
          <label className="mb-1 block text-xs font-medium text-[#86868b]">なぜこの目標なのか</label>
          <textarea
            value={why}
            onChange={(e) => setGoal({ why: e.target.value })}
            placeholder="達成したい理由・なりたい姿を書いておくと、迷った時の指針になります"
            className="h-16 w-full resize-none rounded-xl bg-[#f5f5f7] p-3 text-sm leading-relaxed text-[#1d1d1f] outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
          />
        </div>

        {roadmapDoc ? (
          <div className="rounded-2xl bg-[#f5f5f7] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1d1d1f]">分解した項目数</span>
              <span className="text-sm font-bold text-[#0071e3]">{total} 件</span>
            </div>
            <button
              type="button"
              onClick={handleOpenRoadmap}
              className="rounded-full bg-[#0071e3] px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0077ed]"
            >
              ロードマップを開く →
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#f5f5f7] p-6 text-center">
            <p className="mb-4 text-sm leading-relaxed text-[#86868b]">
              目標をマインドマップ形式で分解すると、何をすべきかが見えてきます。
              <br />
              「{title || '目標'}」を達成するために必要なことを図で洗い出しましょう。
            </p>
            <button
              type="button"
              onClick={handleCreateRoadmap}
              className="rounded-full bg-[#0071e3] px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0077ed]"
            >
              🎯 ロードマップを作成する
            </button>
          </div>
        )}

        <p className="text-xs leading-relaxed text-[#c7c7cc]">
          ロードマップ内でTabキーを押すと子ノードを追加できます。目標をどんどん分解していきましょう。
        </p>
      </div>

      <div className="flex w-64 shrink-0 flex-col border-l border-[#d2d2d7] pl-4">
        <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#86868b]">
          目標に向けた行動ログ
        </span>
        <div className="flex-1 overflow-y-auto">
          {actionLog.map((e) => (
            <div
              key={e.id}
              onClick={() => onJumpToDate(e.date)}
              className="group mb-1 cursor-pointer rounded-xl px-3 py-2 text-xs text-[#1d1d1f] transition-colors duration-200 hover:bg-black/[0.03]"
            >
              <span className="font-medium">{formatDayLabel(e.date)}</span>
              <p className="mt-0.5 truncate text-[#86868b]">{e.goalAction}</p>
            </div>
          ))}
          {actionLog.length === 0 && (
            <p className="px-1 py-4 text-center text-xs text-[#86868b]">
              日次振り返りタブで「目標に向けて取り組んだこと」を記録すると、ここに積み上がります。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
