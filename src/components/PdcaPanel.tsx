import { useState } from 'react'
import { findPdcaFile, loadPdcaFromDrive, savePdcaToDrive } from '../lib/googleDrive'
import { useDriveAutoSave } from '../lib/useDriveAutoSave'
import { usePdcaStore } from '../store'
import type { PdcaGrade, PdcaIssue, PdcaTimeUnit } from '../types'
import CycleDropdown from './CycleDropdown'

function PdcaStep({
  number,
  title,
  description,
  isLast,
  children,
}: {
  number: number
  title: string
  description: string
  isLast?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0071e3] text-xs font-bold text-white">
          {number}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-[#d2d2d7]" />}
      </div>
      <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-8'}`}>
        <h3 className="text-sm font-semibold tracking-tight text-[#1d1d1f]">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[#86868b]">{description}</p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}

function StepInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-sm text-[#1d1d1f] outline-none ring-1 ring-transparent transition-colors focus:bg-white focus:ring-[#0071e3]"
    />
  )
}

const ISSUE_PROMPTS = [
  'ゴールから逆算すると何をすべきなのか',
  'この道を進むとしたら何が不足しているのか',
  '得意分野を加速するために、伸ばせる長所はないか',
  'あらかじめ手を打っておくべきリスクはないか？',
  '周りでうまくいっている人は、どんな工夫をしているのか？',
]

const ISSUE_EXAMPLES = [
  'プレゼン勝負になると勝てない',
  'スケジューリングが下手で１日に３件しか回れない',
  'ヒアリング能力が低い',
  '早口になってしまうことが多い',
  '第一印象が悪い',
]

function IssueList({ cycleId, issues }: { cycleId: string; issues: PdcaIssue[] }) {
  const addIssue = usePdcaStore((s) => s.addIssue)
  const updateIssue = usePdcaStore((s) => s.updateIssue)
  const deleteIssue = usePdcaStore((s) => s.deleteIssue)
  const [draft, setDraft] = useState('')
  const [hintsOpen, setHintsOpen] = useState(true)

  function submit() {
    if (!draft.trim()) return
    addIssue(cycleId, draft.trim())
    setDraft('')
  }

  const issueTexts = new Set(issues.map((i) => i.text))
  const availableExamples = ISSUE_EXAMPLES.filter((e) => !issueTexts.has(e))

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-[#0071e3]/5 p-3">
        <button
          type="button"
          onClick={() => setHintsOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left text-xs font-semibold text-[#0071e3]"
        >
          <span>💡 視点を変えて考えてみましょう</span>
          <span className={`transition-transform duration-200 ${hintsOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {hintsOpen && (
          <ul className="mt-2 space-y-1.5">
            {ISSUE_PROMPTS.map((prompt) => (
              <li key={prompt} className="flex gap-1.5 text-xs leading-relaxed text-[#1d1d1f]/80">
                <span className="text-[#0071e3]">・</span>
                {prompt}
              </li>
            ))}
          </ul>
        )}
      </div>

      {availableExamples.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-[#86868b]">課題の例:</span>
          {availableExamples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => addIssue(cycleId, example)}
              className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] text-[#1d1d1f] transition-colors hover:bg-[#0071e3]/10 hover:text-[#0071e3]"
            >
              ＋ {example}
            </button>
          ))}
        </div>
      )}

      {issues.map((issue) => (
        <div key={issue.id} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0071e3]" />
          <input
            value={issue.text}
            onChange={(e) => updateIssue(cycleId, issue.id, e.target.value)}
            className="min-w-0 flex-1 rounded-lg bg-[#f5f5f7] px-2.5 py-1.5 text-sm text-[#1d1d1f] outline-none ring-1 ring-transparent transition-colors focus:bg-white focus:ring-[#0071e3]"
          />
          <button
            type="button"
            onClick={() => deleteIssue(cycleId, issue.id)}
            title="この課題を削除"
            className="shrink-0 rounded-full px-1.5 text-xs text-[#c7c7cc] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
          >
            ×
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d2d2d7]" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="＋ 課題を追加"
          className="min-w-0 flex-1 rounded-lg border border-dashed border-[#d2d2d7] bg-transparent px-2.5 py-1.5 text-sm text-[#1d1d1f] outline-none transition-colors focus:border-solid focus:border-[#0071e3] focus:bg-white"
        />
        <button
          type="button"
          onClick={submit}
          className="shrink-0 rounded-full bg-[#0071e3]/10 px-2.5 py-1 text-xs font-medium text-[#0071e3] hover:bg-[#0071e3]/20"
        >
          追加
        </button>
      </div>
    </div>
  )
}

const GRADE_STYLES: Record<'A' | 'B' | 'C', string> = {
  A: 'bg-[#34c759]/15 text-[#248a3d]',
  B: 'bg-[#ff9500]/15 text-[#c76a00]',
  C: 'bg-black/5 text-[#6e6e73]',
}

function GradeToggle({ value, onChange }: { value: PdcaGrade; onChange: (v: PdcaGrade) => void }) {
  return (
    <div className="flex justify-center gap-1">
      {(['A', 'B', 'C'] as const).map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(value === g ? null : g)}
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
            value === g ? GRADE_STYLES[g] : 'bg-[#f5f5f7] text-[#c7c7cc] hover:text-[#86868b]'
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  )
}

function TimeInput({
  amount,
  unit,
  onChangeAmount,
  onChangeUnit,
}: {
  amount: number | null
  unit: PdcaTimeUnit
  onChangeAmount: (v: number | null) => void
  onChangeUnit: (v: PdcaTimeUnit) => void
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <input
        type="number"
        min={0}
        value={amount ?? ''}
        onChange={(e) => onChangeAmount(e.target.value === '' ? null : Number(e.target.value))}
        placeholder="0"
        className="w-14 rounded-lg bg-white px-1.5 py-1 text-center text-sm text-[#1d1d1f] outline-none ring-1 ring-[#d2d2d7] transition-colors focus:ring-2 focus:ring-[#0071e3]"
      />
      <div className="flex gap-0.5 rounded-full bg-[#f5f5f7] p-0.5 text-[10px]">
        {(
          [
            ['weeks', '週間'],
            ['months', 'ヶ月'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChangeUnit(key)}
            className={`rounded-full px-1.5 py-0.5 font-medium transition-colors ${
              unit === key ? 'bg-white text-[#0071e3] shadow-sm' : 'text-[#86868b]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

const PRIORITY_TIPS = [
  'インパクトの大きいものを最低でもひとつ選ぶ',
  'インパクトが劣っていても短い時間できそうなものがあれば選ぶ',
  '同列の課題が並んでいたら、気軽さを基準に絞り込む',
]

function IssuePriorityList({ cycleId, issues }: { cycleId: string; issues: PdcaIssue[] }) {
  const rateIssue = usePdcaStore((s) => s.rateIssue)
  const toggleIssueSelected = usePdcaStore((s) => s.toggleIssueSelected)
  const [tipsOpen, setTipsOpen] = useState(true)
  const selectedCount = issues.filter((i) => i.selected).length

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-[#0071e3]/5 p-3">
        <button
          type="button"
          onClick={() => setTipsOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left text-xs font-semibold text-[#0071e3]"
        >
          <span>💡 選び方のヒント</span>
          <span className={`transition-transform duration-200 ${tipsOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {tipsOpen && (
          <ul className="mt-2 space-y-1.5">
            {PRIORITY_TIPS.map((tip) => (
              <li key={tip} className="flex gap-1.5 text-xs leading-relaxed text-[#1d1d1f]/80">
                <span className="text-[#0071e3]">・</span>
                {tip}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_80px_136px_80px_52px] items-center gap-2 px-2 text-[11px] font-medium text-[#86868b]">
        <span />
        <span className="text-center">インパクト</span>
        <span className="text-center">時間</span>
        <span className="text-center">気軽さ</span>
        <span />
      </div>

      {issues.map((issue) => (
        <div
          key={issue.id}
          className={`grid grid-cols-[minmax(0,1fr)_80px_136px_80px_52px] items-center gap-2 rounded-xl p-2 transition-colors ${
            issue.selected ? 'bg-[#0071e3]/5 ring-1 ring-[#0071e3]/30' : 'bg-[#f5f5f7]'
          }`}
        >
          <span className="min-w-0 truncate text-sm text-[#1d1d1f]">{issue.text}</span>
          <GradeToggle value={issue.impact} onChange={(v) => rateIssue(cycleId, issue.id, { impact: v })} />
          <TimeInput
            amount={issue.timeAmount}
            unit={issue.timeUnit}
            onChangeAmount={(v) => rateIssue(cycleId, issue.id, { timeAmount: v })}
            onChangeUnit={(v) => rateIssue(cycleId, issue.id, { timeUnit: v })}
          />
          <GradeToggle value={issue.ease} onChange={(v) => rateIssue(cycleId, issue.id, { ease: v })} />
          <button
            type="button"
            onClick={() => toggleIssueSelected(cycleId, issue.id)}
            disabled={!issue.selected && selectedCount >= 3}
            className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              issue.selected
                ? 'bg-[#0071e3] text-white'
                : 'bg-white text-[#86868b] ring-1 ring-[#d2d2d7] hover:text-[#0071e3]'
            }`}
          >
            {issue.selected ? '選択中' : '選ぶ'}
          </button>
        </div>
      ))}

      <p className="px-1 text-xs text-[#86868b]">{selectedCount} / 3 件選択中</p>
    </div>
  )
}

const KPI_EXAMPLES = ['プレゼンの勝率30%→50%', 'アポイント1日3件→6件']

function KpiList({ cycleId, issues }: { cycleId: string; issues: PdcaIssue[] }) {
  const rateIssue = usePdcaStore((s) => s.rateIssue)
  const [tipsOpen, setTipsOpen] = useState(true)

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-[#0071e3]/5 p-3">
        <button
          type="button"
          onClick={() => setTipsOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left text-xs font-semibold text-[#0071e3]"
        >
          <span>📊 KPIの書き方の例（今→目標の数字で）</span>
          <span className={`transition-transform duration-200 ${tipsOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {tipsOpen && (
          <ul className="mt-2 space-y-1.5">
            {KPI_EXAMPLES.map((example) => (
              <li key={example} className="flex gap-1.5 text-xs leading-relaxed text-[#1d1d1f]/80">
                <span className="text-[#0071e3]">・</span>
                {example}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        {issues.map((issue) => (
          <div key={issue.id} className="rounded-xl bg-[#f5f5f7] p-3">
            <p className="mb-1.5 text-sm font-medium text-[#1d1d1f]">{issue.text}</p>
            <input
              value={issue.kpi}
              onChange={(e) => rateIssue(cycleId, issue.id, { kpi: e.target.value })}
              placeholder="例: プレゼンの勝率30%→50%"
              className="w-full rounded-lg bg-white px-2.5 py-1.5 text-sm text-[#1d1d1f] outline-none ring-1 ring-[#d2d2d7] transition-colors focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function SolutionsForIssue({ cycleId, issue }: { cycleId: string; issue: PdcaIssue }) {
  const addSolution = usePdcaStore((s) => s.addSolution)
  const updateSolution = usePdcaStore((s) => s.updateSolution)
  const deleteSolution = usePdcaStore((s) => s.deleteSolution)
  const [draft, setDraft] = useState('')

  function submit() {
    if (!draft.trim()) return
    addSolution(cycleId, issue.id, draft.trim())
    setDraft('')
  }

  return (
    <div className="rounded-xl bg-[#f5f5f7] p-3">
      <p className="text-sm font-medium text-[#1d1d1f]">{issue.text}</p>
      <p className="mb-2 text-xs text-[#0071e3]">🎯 {issue.kpi}</p>

      <div className="space-y-1.5">
        {issue.solutions.map((sol) => (
          <div key={sol.id} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0071e3]" />
            <input
              value={sol.text}
              onChange={(e) => updateSolution(cycleId, issue.id, sol.id, e.target.value)}
              className="min-w-0 flex-1 rounded-lg bg-white px-2.5 py-1.5 text-sm text-[#1d1d1f] outline-none ring-1 ring-transparent transition-colors focus:ring-[#0071e3]"
            />
            <button
              type="button"
              onClick={() => deleteSolution(cycleId, issue.id, sol.id)}
              title="この解決案を削除"
              className="shrink-0 rounded-full px-1.5 text-xs text-[#c7c7cc] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
            >
              ×
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d2d2d7]" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder="例: 週に2回、既存顧客に紹介を依頼する"
            className="min-w-0 flex-1 rounded-lg border border-dashed border-[#d2d2d7] bg-transparent px-2.5 py-1.5 text-sm text-[#1d1d1f] outline-none transition-colors focus:border-solid focus:border-[#0071e3] focus:bg-white"
          />
          <button
            type="button"
            onClick={submit}
            className="shrink-0 rounded-full bg-[#0071e3]/10 px-2.5 py-1 text-xs font-medium text-[#0071e3] hover:bg-[#0071e3]/20"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  )
}

function SolutionList({ cycleId, issues }: { cycleId: string; issues: PdcaIssue[] }) {
  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <SolutionsForIssue key={issue.id} cycleId={cycleId} issue={issue} />
      ))}
    </div>
  )
}

function HoursInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <input
        type="number"
        min={0}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder="0"
        className="w-14 rounded-lg bg-white px-1.5 py-1 text-center text-sm text-[#1d1d1f] outline-none ring-1 ring-[#d2d2d7] transition-colors focus:ring-2 focus:ring-[#0071e3]"
      />
      <span className="shrink-0 text-[10px] text-[#86868b]">時間</span>
    </div>
  )
}

function DoList({ cycleId, issues }: { cycleId: string; issues: PdcaIssue[] }) {
  const rateSolution = usePdcaStore((s) => s.rateSolution)

  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <div key={issue.id}>
          <p className="mb-1.5 text-xs font-medium text-[#1d1d1f]">
            {issue.text} <span className="text-[#0071e3]">🎯 {issue.kpi}</span>
          </p>

          {issue.solutions.length === 0 ? (
            <p className="px-2 text-xs text-[#c7c7cc]">解決案がまだありません</p>
          ) : (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[minmax(0,1fr)_80px_100px_80px] items-center gap-2 px-2 text-[11px] font-medium text-[#86868b]">
                <span />
                <span className="text-center">インパクト</span>
                <span className="text-center">時間</span>
                <span className="text-center">気軽さ</span>
              </div>
              {issue.solutions.map((sol) => (
                <div
                  key={sol.id}
                  className="grid grid-cols-[minmax(0,1fr)_80px_100px_80px] items-center gap-2 rounded-xl bg-[#f5f5f7] p-2"
                >
                  <span className="min-w-0 truncate text-sm text-[#1d1d1f]">{sol.text}</span>
                  <GradeToggle
                    value={sol.impact}
                    onChange={(v) => rateSolution(cycleId, issue.id, sol.id, { impact: v })}
                  />
                  <HoursInput
                    value={sol.timeHours}
                    onChange={(v) => rateSolution(cycleId, issue.id, sol.id, { timeHours: v })}
                  />
                  <GradeToggle
                    value={sol.ease}
                    onChange={(v) => rateSolution(cycleId, issue.id, sol.id, { ease: v })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function PdcaPanel() {
  const cycles = usePdcaStore((s) => s.cycles)
  const activeCycleId = usePdcaStore((s) => s.activeCycleId)
  const setActiveCycleId = usePdcaStore((s) => s.setActiveCycleId)
  const createCycle = usePdcaStore((s) => s.createCycle)
  const deleteCycle = usePdcaStore((s) => s.deleteCycle)
  const updateCycle = usePdcaStore((s) => s.updateCycle)
  const driveFileId = usePdcaStore((s) => s.driveFileId)
  const setDriveFileId = usePdcaStore((s) => s.setDriveFileId)
  const mergeFromDrive = usePdcaStore((s) => s.mergeFromDrive)
  const [driveStatus, setDriveStatus] = useState<string | null>(null)
  const [driveBusy, setDriveBusy] = useState(false)

  const cycle = cycles.find((c) => c.id === activeCycleId) ?? cycles[0]

  function flashDrive(message: string) {
    setDriveStatus(message)
    setTimeout(() => setDriveStatus(null), 4000)
  }

  async function handleDriveSave() {
    setDriveBusy(true)
    try {
      const fileId = await savePdcaToDrive(usePdcaStore.getState().cycles, driveFileId)
      setDriveFileId(fileId)
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
      const file = driveFileId ? { id: driveFileId } : await findPdcaFile()
      if (!file) {
        flashDrive('Googleドライブに保存されたPDCAが見つかりません。先に「Driveに保存」してください。')
        return
      }
      const remoteCycles = await loadPdcaFromDrive(file.id)
      mergeFromDrive(remoteCycles)
      setDriveFileId(file.id)
      flashDrive('Googleドライブから読み込みました')
    } catch (err) {
      flashDrive(err instanceof Error ? err.message : '読み込みに失敗しました')
    } finally {
      setDriveBusy(false)
    }
  }

  useDriveAutoSave(Boolean(driveFileId), cycle?.updatedAt, handleDriveSave)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CycleDropdown cycles={cycles} activeCycle={cycle} onSelect={setActiveCycleId} />
          <button
            type="button"
            onClick={() => createCycle(`サイクル ${cycles.length + 1}`)}
            title="新しいサイクルを作成"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0071e3] text-sm font-bold text-white hover:bg-[#0077ed]"
          >
            +
          </button>
          {cycle && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`「${cycle.title}」を削除しますか？`)) deleteCycle(cycle.id)
              }}
              className="rounded-full px-2 py-1 text-xs text-[#c7c7cc] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
            >
              削除
            </button>
          )}
        </div>

        <div className="relative flex items-center gap-1">
          {driveFileId && (
            <span className="flex items-center gap-1 rounded-full bg-[#34c759]/10 px-2.5 py-1 text-[10px] font-medium text-[#248a3d]">
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

      {!cycle ? (
        <p className="px-1 py-8 text-center text-sm text-[#86868b]">
          鬼速PDCAのサイクルがまだありません。「+」から作成しましょう。
        </p>
      ) : (
        <div className="mx-auto w-full max-w-lg pt-6">
          <PdcaStep
            number={1}
            title="大目標（KGI）を決めましょう"
            description="このサイクルで最終的に達成したい、定量的な大目標を1つ書きましょう。"
          >
            <StepInput
              autoFocus
              value={cycle.kgiGoal}
              onChange={(e) => updateCycle(cycle.id, { kgiGoal: e.target.value })}
              placeholder="例: 新規契約を月10件獲得する"
            />
            <div className="mt-3 flex items-center gap-2">
              <label htmlFor="kgi-deadline" className="text-xs font-medium text-[#86868b]">
                達成期限
              </label>
              <input
                id="kgi-deadline"
                type="date"
                value={cycle.kgiDeadline}
                onChange={(e) => updateCycle(cycle.id, { kgiDeadline: e.target.value })}
                className="rounded-lg bg-[#f5f5f7] px-2.5 py-1.5 text-sm text-[#1d1d1f] outline-none ring-1 ring-transparent transition-colors focus:bg-white focus:ring-[#0071e3]"
              />
            </div>
          </PdcaStep>

          {cycle.kgiGoal.trim() && (
            <PdcaStep
              number={2}
              title="現状はどうですか？"
              description="大目標に対して、今どこまで来ているかを書きましょう。"
            >
              <StepInput
                autoFocus
                value={cycle.currentState}
                onChange={(e) => updateCycle(cycle.id, { currentState: e.target.value })}
                placeholder="例: 現在は月4件契約できている"
              />
            </PdcaStep>
          )}

          {cycle.kgiGoal.trim() && cycle.currentState.trim() && (
            <PdcaStep
              number={3}
              title="ギャップを言語化しましょう"
              description="大目標と現状の差は何か。埋めるべきギャップをひと言で書きましょう。この後の課題出しの土台になります。"
            >
              <StepInput
                autoFocus
                value={cycle.gap}
                onChange={(e) => updateCycle(cycle.id, { gap: e.target.value })}
                placeholder="例: あと月6件足りない"
              />
            </PdcaStep>
          )}

          {cycle.kgiGoal.trim() && cycle.currentState.trim() && cycle.gap.trim() && (
            <PdcaStep
              number={4}
              title="ギャップを埋める課題を洗い出しましょう"
              description="ギャップを埋めるためにやれそうなことを、思いつく限り挙げましょう。多いほど後で選びやすくなります。"
            >
              <IssueList cycleId={cycle.id} issues={cycle.issues} />
            </PdcaStep>
          )}

          {cycle.issues.length > 0 && (
            <PdcaStep
              number={5}
              title="優先順位をつけて、3つに絞りましょう"
              description="それぞれの課題を「インパクト」「かかる時間」「気軽さ」で評価し、実際に取り組む3つを選びます。"
            >
              <IssuePriorityList cycleId={cycle.id} issues={cycle.issues} />
            </PdcaStep>
          )}

          {cycle.issues.some((i) => i.selected) && (
            <PdcaStep
              number={6}
              title="選んだ課題をKPI化しましょう"
              description="達成できたかどうかが誰の目にも明らかになるよう、数字で測れる目標に落とし込みます。"
            >
              <KpiList cycleId={cycle.id} issues={cycle.issues.filter((i) => i.selected)} />
            </PdcaStep>
          )}

          {cycle.issues.some((i) => i.selected && i.kpi.trim()) && (
            <PdcaStep
              number={7}
              title="KPIを達成するための解決案を考えましょう"
              description="そのKPIを達成するために、具体的に何をするかを書きましょう。ここが実行(Do)の中身になります。"
            >
              <SolutionList cycleId={cycle.id} issues={cycle.issues.filter((i) => i.selected && i.kpi.trim())} />
            </PdcaStep>
          )}

          {cycle.issues.some((i) => i.selected && i.kpi.trim() && i.solutions.length > 0) && (
            <PdcaStep
              number={8}
              title="解決案をDOとして評価しましょう"
              description="実行に移す解決案を「インパクト」「かかる時間」「気軽さ」で評価し、優先順位をつけましょう。"
              isLast
            >
              <DoList
                cycleId={cycle.id}
                issues={cycle.issues.filter((i) => i.selected && i.kpi.trim() && i.solutions.length > 0)}
              />
            </PdcaStep>
          )}
        </div>
      )}
    </div>
  )
}
