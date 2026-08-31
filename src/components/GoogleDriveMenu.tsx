import { useState } from 'react'
import {
  listDriveFiles,
  loadDriveFile,
  saveDocToDrive,
  type DriveFileSummary,
} from '../lib/googleDrive'
import { useDriveAutoSave } from '../lib/useDriveAutoSave'
import { useFlowStore } from '../store'

export default function GoogleDriveMenu() {
  const doc = useFlowStore((s) => s.activeDoc())
  const setDriveFileId = useFlowStore((s) => s.setDriveFileId)
  const importFromDrive = useFlowStore((s) => s.importFromDrive)
  const [status, setStatus] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [files, setFiles] = useState<DriveFileSummary[]>([])
  const [loadingList, setLoadingList] = useState(false)

  function flash(message: string) {
    setStatus(message)
    setTimeout(() => setStatus(null), 4000)
  }

  async function handleSave() {
    setStatus('Googleドライブに保存中…')
    try {
      const fileId = await saveDocToDrive(doc)
      setDriveFileId(doc.id, fileId)
      flash('Googleドライブに保存しました')
    } catch (err) {
      flash(err instanceof Error ? err.message : '保存に失敗しました')
    }
  }

  async function handleOpenPicker() {
    setPickerOpen(true)
    setLoadingList(true)
    try {
      setFiles(await listDriveFiles())
    } catch (err) {
      flash(err instanceof Error ? err.message : '一覧の取得に失敗しました')
      setPickerOpen(false)
    } finally {
      setLoadingList(false)
    }
  }

  async function handlePick(file: DriveFileSummary) {
    setPickerOpen(false)
    setStatus('読み込み中…')
    try {
      const loaded = await loadDriveFile(file.id)
      importFromDrive(loaded, file.id)
      flash('Googleドライブから読み込みました')
    } catch (err) {
      flash(err instanceof Error ? err.message : '読み込みに失敗しました')
    }
  }

  useDriveAutoSave(Boolean(doc.driveFileId), doc, handleSave)

  return (
    <div className="relative flex items-center gap-2">
      {doc.driveFileId && (
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
        onClick={handleSave}
        className="rounded-full px-3 py-1.5 text-xs text-[#86868b] transition-colors duration-200 hover:bg-black/[0.03]"
      >
        Driveに保存
      </button>
      <button
        type="button"
        onClick={handleOpenPicker}
        className="rounded-full px-3 py-1.5 text-xs text-[#86868b] transition-colors duration-200 hover:bg-black/[0.03]"
      >
        Driveから開く
      </button>

      {status && (
        <div className="absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-full bg-[#1d1d1f]/95 px-3 py-1 text-xs text-white shadow-md">
          {status}
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="max-h-[70vh] w-96 overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight text-[#1d1d1f]">
                Googleドライブのフローを開く
              </h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.03] hover:text-[#1d1d1f]"
              >
                ×
              </button>
            </div>
            {loadingList ? (
              <p className="text-sm text-[#86868b]">読み込み中…</p>
            ) : files.length === 0 ? (
              <p className="text-sm text-[#86868b]">
                保存されたフローが見つかりません。まず「Driveに保存」で保存してください。
              </p>
            ) : (
              <ul className="space-y-1">
                {files.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => handlePick(f)}
                      className="w-full rounded-xl px-2 py-1.5 text-left text-sm text-[#1d1d1f] hover:bg-[#0071e3]/10"
                    >
                      <div className="truncate font-medium">{f.name}</div>
                      <div className="text-xs text-[#86868b]">
                        {new Date(f.modifiedTime).toLocaleString('ja-JP')}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
