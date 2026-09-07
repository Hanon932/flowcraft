import { usePdcaStore } from '../store'
import type { PdcaDoLog, PdcaGrade, PdcaIssue } from '../types'
import CycleDropdown from './CycleDropdown'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// Current streak: consecutive done days counting back from today. If today
// isn't marked done yet, start counting from yesterday instead so the
// streak doesn't look broken before the day is even over.
function computeStreak(doLogs: PdcaDoLog[], solutionId: string): number {
  const doneDates = new Set(doLogs.filter((l) => l.solutionId === solutionId && l.done).map((l) => l.date))
  if (doneDates.size === 0) return 0

  const cursor = new Date()
  let ds = cursor.toISOString().slice(0, 10)
  if (!doneDates.has(ds)) {
    cursor.setDate(cursor.getDate() - 1)
    ds = cursor.toISOString().slice(0, 10)
  }

  let streak = 0
  while (doneDates.has(ds)) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
    ds = cursor.toISOString().slice(0, 10)
  }
  return streak
}

const GRADE_STYLES: Record<'A' | 'B' | 'C', string> = {
  A: 'bg-[#34c759]/15 text-[#248a3d]',
  B: 'bg-[#ff9500]/15 text-[#c76a00]',
  C: 'bg-black/5 text-[#6e6e73]',
}

function GradeBadge({ grade }: { grade: PdcaGrade }) {
  if (!grade) return null
  return (
    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${GRADE_STYLES[grade]}`}>
      {grade}
    </span>
  )
}

function DoRow({ issue, solution }: { issue: PdcaIssue; solution: PdcaIssue['solutions'][number] }) {
  const doLogs = usePdcaStore((s) => s.doLogs)
  const upsertDoLog = usePdcaStore((s) => s.upsertDoLog)
  const date = todayStr()
  const log = doLogs.find((l) => l.solutionId === solution.id && l.date === date)
  const streak = computeStreak(doLogs, solution.id)

  return (
    <div className="rounded-xl bg-[#f5f5f7] p-3">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => upsertDoLog(solution.id, date, { done: !log?.done })}
          title="今日実行できた"
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs transition-colors ${
            log?.done ? 'bg-[#34c759] text-white' : 'bg-white text-transparent ring-1 ring-[#d2d2d7] hover:ring-[#0071e3]'
          }`}
        >
          ✓
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={`text-sm ${log?.done ? 'text-[#86868b] line-through' : 'text-[#1d1d1f]'}`}>{solution.text}</p>
            {streak > 0 && (
              <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#ff9500]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#c76a00]">
                🔥 {streak}日継続
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[10px] text-[#86868b]">
            {issue.text} ・ 🎯 {issue.kpi}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <GradeBadge grade={solution.impact} />
            {solution.timeHours != null && (
              <span className="text-[10px] text-[#86868b]">{solution.timeHours}時間</span>
            )}
            <GradeBadge grade={solution.ease} />
          </div>
        </div>
      </div>
      <input
        value={log?.note ?? ''}
        onChange={(e) => upsertDoLog(solution.id, date, { note: e.target.value })}
        placeholder="今日の進捗メモ（任意）"
        className="mt-2 w-full rounded-lg bg-white px-2.5 py-1.5 text-xs text-[#1d1d1f] outline-none ring-1 ring-transparent transition-colors focus:ring-[#0071e3]"
      />
    </div>
  )
}

export default function DailyPanel() {
  const cycles = usePdcaStore((s) => s.cycles)
  const activeCycleId = usePdcaStore((s) => s.activeCycleId)
  const setActiveCycleId = usePdcaStore((s) => s.setActiveCycleId)
  const cycle = cycles.find((c) => c.id === activeCycleId) ?? cycles[0]

  const kpiIssues = cycle?.issues.filter((i) => i.selected && i.kpi.trim()) ?? []
  const doItems = kpiIssues.flatMap((issue) => issue.solutions.map((solution) => ({ issue, solution })))

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <CycleDropdown cycles={cycles} activeCycle={cycle} onSelect={setActiveCycleId} />
        <span className="text-xs text-[#86868b]">
          {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
        </span>
      </div>

      {!cycle ? (
        <p className="px-1 py-8 text-center text-sm text-[#86868b]">
          PDCAのサイクルがまだありません。まずはPDCA画面でサイクルを作成しましょう。
        </p>
      ) : (
        <div className="mx-auto w-full max-w-lg space-y-5 pb-8">
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#86868b]">KGI</h3>
            {cycle.kgiGoal.trim() ? (
              <div className="rounded-xl bg-[#f5f5f7] p-3">
                <p className="text-sm font-medium text-[#1d1d1f]">{cycle.kgiGoal}</p>
                {cycle.kgiDeadline && (
                  <p className="mt-1 text-xs text-[#86868b]">期限: {cycle.kgiDeadline}</p>
                )}
              </div>
            ) : (
              <p className="px-1 text-xs text-[#c7c7cc]">まだ入力されていません</p>
            )}
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#86868b]">ギャップ</h3>
            {cycle.gap.trim() ? (
              <div className="rounded-xl bg-[#f5f5f7] p-3">
                <p className="text-sm text-[#1d1d1f]">{cycle.gap}</p>
              </div>
            ) : (
              <p className="px-1 text-xs text-[#c7c7cc]">まだ入力されていません</p>
            )}
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#86868b]">KPI</h3>
            {kpiIssues.length > 0 ? (
              <div className="space-y-2">
                {kpiIssues.map((issue) => (
                  <div key={issue.id} className="rounded-xl bg-[#f5f5f7] p-3">
                    <p className="text-xs text-[#86868b]">{issue.text}</p>
                    <p className="mt-0.5 text-sm font-medium text-[#0071e3]">🎯 {issue.kpi}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-1 text-xs text-[#c7c7cc]">まだ入力されていません</p>
            )}
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#86868b]">DO（今日実行できたか）</h3>
            {doItems.length > 0 ? (
              <div className="space-y-2">
                {doItems.map(({ issue, solution }) => (
                  <DoRow key={solution.id} issue={issue} solution={solution} />
                ))}
              </div>
            ) : (
              <p className="px-1 text-xs text-[#c7c7cc]">まだ入力されていません</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
