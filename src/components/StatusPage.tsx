import { useMemo, useRef, useState } from 'react'
import { BRANCH_COLORS } from '../lib/palette'
import { useClickOutside } from '../lib/useClickOutside'
import { useStatusStore } from '../statusStore'
import RadarChart from './RadarChart'

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export default function StatusPage() {
  const categories = useStatusStore((s) => s.categories)
  const addCategory = useStatusStore((s) => s.addCategory)
  const renameCategory = useStatusStore((s) => s.renameCategory)
  const recolorCategory = useStatusStore((s) => s.recolorCategory)
  const deleteCategory = useStatusStore((s) => s.deleteCategory)
  const addItem = useStatusStore((s) => s.addItem)
  const updateItem = useStatusStore((s) => s.updateItem)
  const deleteItem = useStatusStore((s) => s.deleteItem)

  const [newItemDrafts, setNewItemDrafts] = useState<Record<string, string>>({})
  const [colorMenuFor, setColorMenuFor] = useState<string | null>(null)
  const colorMenuRef = useRef<HTMLDivElement>(null)
  useClickOutside(Boolean(colorMenuFor), () => setColorMenuFor(null), [colorMenuRef])

  const overviewItems = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        value: average(c.items.map((it) => it.value)),
      })),
    [categories],
  )

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl min-h-0 flex-col gap-8 overflow-y-auto p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f]">ステータス</h1>
        <p className="mt-1 text-xs leading-relaxed text-[#86868b]">
          基礎力を底上げしながら応用力を伸ばしていくための、自分の能力チェックシートです。カテゴリや項目は自由に追加・編集・削除できます。
        </p>
      </div>

      {categories.length >= 3 && (
        <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-[#d2d2d7]">
          <div className="mb-2 text-sm font-semibold tracking-tight text-[#1d1d1f]">全体バランス</div>
          <RadarChart items={overviewItems} color="#0071e3" size={300} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-[#d2d2d7]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  title="色を変更"
                  onClick={() => setColorMenuFor(colorMenuFor === c.id ? null : c.id)}
                  className="h-3 w-3 shrink-0 rounded-full ring-2 ring-offset-1"
                  style={{ backgroundColor: c.color, boxShadow: `0 0 0 1px ${c.color}` }}
                />
                {colorMenuFor === c.id && (
                  <div
                    ref={colorMenuRef}
                    className="absolute left-0 top-6 z-10 grid grid-cols-4 gap-1 rounded-xl bg-white p-2 shadow-lg ring-1 ring-[#d2d2d7]"
                  >
                    {BRANCH_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          recolorCategory(c.id, color)
                          setColorMenuFor(null)
                        }}
                        className={`h-5 w-5 rounded-full ring-1 ${
                          c.color === color ? 'ring-2 ring-[#0071e3]' : 'ring-black/10'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
                <input
                  value={c.name}
                  onChange={(e) => renameCategory(c.id, e.target.value)}
                  className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 text-sm font-semibold tracking-tight text-[#1d1d1f] outline-none ring-1 ring-transparent hover:ring-[#d2d2d7] focus:bg-[#f5f5f7] focus:ring-[#0071e3]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`「${c.name}」を削除しますか？`)) deleteCategory(c.id)
                }}
                title="カテゴリを削除"
                className="shrink-0 rounded-full px-2 py-1 text-xs text-[#86868b] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
              >
                ×
              </button>
            </div>

            <div className="flex justify-center">
              <RadarChart items={c.items} color={c.color} size={260} />
            </div>

            <div className="flex flex-col gap-2">
              {c.items.map((it) => (
                <div key={it.id} className="group flex items-center gap-2">
                  <input
                    value={it.name}
                    onChange={(e) => updateItem(c.id, it.id, { name: e.target.value })}
                    className="w-24 shrink-0 truncate rounded-md bg-transparent px-1 py-0.5 text-xs text-[#1d1d1f] outline-none ring-1 ring-transparent hover:ring-[#d2d2d7] focus:bg-[#f5f5f7] focus:ring-[#0071e3]"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={it.value}
                    onChange={(e) => updateItem(c.id, it.id, { value: Number(e.target.value) })}
                    className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[#e5e5ea] accent-[#0071e3]"
                  />
                  <span className="w-7 shrink-0 text-right text-xs tabular-nums text-[#86868b]">
                    {it.value}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteItem(c.id, it.id)}
                    className="shrink-0 rounded-full px-1.5 text-xs text-[#86868b] opacity-0 hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] group-hover:opacity-100"
                    title="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={newItemDrafts[c.id] ?? ''}
                onChange={(e) => setNewItemDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  const name = (newItemDrafts[c.id] ?? '').trim()
                  if (!name) return
                  addItem(c.id, name)
                  setNewItemDrafts((d) => ({ ...d, [c.id]: '' }))
                }}
                placeholder="新しい項目名を入力してEnter"
                className="min-w-0 flex-1 rounded-lg bg-[#f5f5f7] px-3 py-1.5 text-xs outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0071e3]"
              />
              <button
                type="button"
                onClick={() => {
                  const name = (newItemDrafts[c.id] ?? '').trim()
                  if (!name) return
                  addItem(c.id, name)
                  setNewItemDrafts((d) => ({ ...d, [c.id]: '' }))
                }}
                className="shrink-0 rounded-full bg-[#0071e3] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0077ed]"
              >
                追加
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            const name = prompt('新しいカテゴリ名を入力してください', 'カテゴリ')
            if (name && name.trim()) addCategory(name.trim())
          }}
          className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#d2d2d7] text-[#86868b] transition-colors duration-200 hover:border-[#0071e3] hover:text-[#0071e3]"
        >
          <span className="text-2xl">+</span>
          <span className="text-xs font-medium">カテゴリを追加</span>
        </button>
      </div>

    </div>
  )
}
