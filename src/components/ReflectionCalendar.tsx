const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

interface ReflectionCalendarProps {
  year: number
  month: number
  selectedDate: string
  todayKey: string
  hasEntry: (dateKey: string) => boolean
  onSelectDate: (dateKey: string) => void
  onChangeMonth: (year: number, month: number) => void
}

export default function ReflectionCalendar({
  year,
  month,
  selectedDate,
  todayKey,
  hasEntry,
  onSelectDate,
  onChangeMonth,
}: ReflectionCalendarProps) {
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  function prevMonth() {
    onChangeMonth(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1)
  }
  function nextMonth() {
    onChangeMonth(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1)
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
          title="前の月"
        >
          ‹
        </button>
        <span className="text-xs font-semibold text-neutral-700">
          {year}年{month}月
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
          title="次の月"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[10px] font-medium text-neutral-300">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`empty-${i}`} />
          const dateKey = toDateKey(year, month, day)
          const selected = dateKey === selectedDate
          const isToday = dateKey === todayKey
          const filled = hasEntry(dateKey)
          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
                selected
                  ? 'bg-sky-500 font-semibold text-white'
                  : isToday
                    ? 'font-semibold text-sky-600 ring-1 ring-sky-300'
                    : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {day}
              {filled && !selected && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-sky-400" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
