interface RadarChartProps {
  items: { id: string; name: string; value: number }[]
  color: string
  size?: number
  max?: number
}

const RING_LEVELS = [0.2, 0.4, 0.6, 0.8, 1]

export default function RadarChart({ items, color, size = 280, max = 100 }: RadarChartProps) {
  const n = items.length
  if (n < 3) {
    return (
      <div
        style={{ height: size }}
        className="flex items-center justify-center text-center text-xs text-[#86868b]"
      >
        項目を3つ以上追加するとレーダーチャートが表示されます
      </div>
    )
  }

  const center = size / 2
  const labelPad = 40
  const radius = center - labelPad
  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2

  const ringPoints = (level: number) =>
    items
      .map((_, i) => {
        const a = angleFor(i)
        const r = radius * level
        return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`
      })
      .join(' ')

  const dataPoints = items.map((it, i) => {
    const a = angleFor(i)
    const clamped = Math.max(0, Math.min(max, it.value))
    const r = radius * (clamped / max)
    return { x: center + r * Math.cos(a), y: center + r * Math.sin(a) }
  })
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {RING_LEVELS.map((level) => (
        <polygon key={level} points={ringPoints(level)} fill="none" stroke="#e5e5ea" strokeWidth={1} />
      ))}
      {items.map((_, i) => {
        const a = angleFor(i)
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(a)}
            y2={center + radius * Math.sin(a)}
            stroke="#e5e5ea"
            strokeWidth={1}
          />
        )
      })}

      <polygon
        points={dataPolygon}
        fill={color}
        fillOpacity={0.14}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke="#ffffff" strokeWidth={2} />
      ))}

      {items.map((it, i) => {
        const a = angleFor(i)
        const cos = Math.cos(a)
        const lx = center + (radius + 16) * cos
        const ly = center + (radius + 16) * Math.sin(a)
        const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle'
        return (
          <text
            key={it.id}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={600}
            fill="#1d1d1f"
          >
            {it.name}
          </text>
        )
      })}
      {dataPoints.map((p, i) => (
        <text
          key={`v-${items[i].id}`}
          x={p.x}
          y={p.y - 9}
          textAnchor="middle"
          fontSize={10}
          fill="#86868b"
        >
          {Math.round(items[i].value)}
        </text>
      ))}
    </svg>
  )
}
