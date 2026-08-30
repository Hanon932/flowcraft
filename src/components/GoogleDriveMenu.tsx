import { useState } from 'react'
import {
  listDriveFiles,
  loadDriveFile,
  saveDocToDrive,
  type DriveFileSummary,
} from '../lib/googleDrive'
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

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={handleSave}
        className="rounded-full px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        Driveに保存
      </button>
      <button
        type="button"
        onClick={handleOpenPicker}
        className="rounded-full px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        Driveから開く
      </button>

      {status && (
        <div className="absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-full bg-neutral-800/90 px-3 py-1 text-xs text-white shadow-md">
          {status}
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-neutral-900/30 backdrop-blur-sm">
          <div className="max-h-[70vh] w-96 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl dark:bg-neutral-800">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                Googleドライブのフローを開く
              </h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                ×
              </button>
            </div>
            {loadingList ? (
              <p className="text-sm text-neutral-400">読み込み中…</p>
            ) : files.length === 0 ? (
              <p className="text-sm text-neutral-400">
                保存されたフローが見つかりません。まず「Driveに保存」で保存してください。
              </p>
            ) : (
              <ul className="space-y-1">
                {files.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => handlePick(f)}
                      className="w-full rounded-xl px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-sky-50 dark:text-neutral-200 dark:hover:bg-sky-900/30"
                    >
                      <div className="truncate font-medium">{f.name}</div>
                      <div className="text-xs text-neutral-400">
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
