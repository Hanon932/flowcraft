import { useUiStore, type UiSection } from '../store'

const FEATURES: {
  key: UiSection
  icon: string
  title: string
  description: string
  accent: string
}[] = [
  {
    key: 'flowchart',
    icon: '🗂️',
    title: 'フローチャート',
    description: '手順を図にして、誰が見ても迷わないように整理する。',
    accent: 'from-[#0071e3]/15 to-[#0071e3]/0',
  },
  {
    key: 'mindmap',
    icon: '🧠',
    title: 'マインドマップ',
    description: '思いついたアイデアを自由に広げて、つながりを可視化する。',
    accent: 'from-[#af52de]/15 to-[#af52de]/0',
  },
  {
    key: 'freeform',
    icon: '🖊️',
    title: 'ホワイトボード',
    description: '罫線に縛られず、図形や付箋で自由に書き出す。',
    accent: 'from-[#34c759]/15 to-[#34c759]/0',
  },
  {
    key: 'reflection',
    icon: '⚡',
    title: 'PDCA',
    description: '大目標から課題を洗い出し、優先順位をつけて鬼速で回す。',
    accent: 'from-[#ff9500]/15 to-[#ff9500]/0',
  },
  {
    key: 'daily',
    icon: '📅',
    title: '毎日の振り返り',
    description: 'KGI・ギャップ・KPI・DOを日々見直し、実行を記録する。',
    accent: 'from-[#ff3b30]/15 to-[#ff3b30]/0',
  },
  {
    key: 'status',
    icon: '📊',
    title: 'ステータス',
    description: '基礎力・応用力などの自分の能力をレーダーチャートで可視化する。',
    accent: 'from-[#5ac8fa]/15 to-[#5ac8fa]/0',
  },
]

export default function TopPage() {
  const setSection = useUiStore((s) => s.setSection)

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-gradient-to-b from-[#fbfbfd] to-[#eef1f6] px-6 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0071e3] text-3xl shadow-[0_8px_24px_rgba(0,113,227,0.35)]">
            🧭
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[#1d1d1f]">FlowCraft</h1>
          <p className="mt-2 text-sm text-[#86868b]">
            考えを整理して、目標に向かって前に進むための道具箱
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setSection(f.key)}
              className={`group relative overflow-hidden rounded-2xl bg-white p-6 text-left shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-[#d2d2d7] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)]`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
              />
              <div className="relative">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5f5f7] text-xl">
                  {f.icon}
                </div>
                <div className="text-base font-semibold tracking-tight text-[#1d1d1f]">
                  {f.title}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#86868b]">{f.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#0071e3] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  開く
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                    →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
