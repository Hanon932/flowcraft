import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BRANCH_COLORS } from './lib/palette'

export interface StatusItem {
  id: string
  name: string
  value: number
}

export interface StatusCategory {
  id: string
  name: string
  color: string
  items: StatusItem[]
}

function item(name: string, value: number): StatusItem {
  return { id: nanoid(6), name, value }
}

function category(name: string, color: string, items: StatusItem[]): StatusCategory {
  return { id: nanoid(6), name, color, items }
}

const DEFAULT_CATEGORIES: StatusCategory[] = [
  category('基礎力', BRANCH_COLORS[0], [
    item('集中力', 50),
    item('継続力', 50),
    item('体力・健康', 50),
    item('論理的思考', 50),
    item('読解力', 50),
    item('語彙力', 50),
    item('計算力', 50),
    item('感情コントロール', 50),
  ]),
  category('応用力', BRANCH_COLORS[1], [
    item('問題解決力', 50),
    item('企画力', 50),
    item('実装力', 50),
    item('デザイン力', 50),
    item('プレゼン力', 50),
    item('交渉力', 50),
    item('リーダーシップ', 50),
    item('創造力', 50),
  ]),
]

interface StatusStore {
  categories: StatusCategory[]
  addCategory: (name: string) => void
  renameCategory: (id: string, name: string) => void
  recolorCategory: (id: string, color: string) => void
  deleteCategory: (id: string) => void
  addItem: (categoryId: string, name: string) => void
  updateItem: (categoryId: string, itemId: string, data: Partial<Pick<StatusItem, 'name' | 'value'>>) => void
  deleteItem: (categoryId: string, itemId: string) => void
}

export const useStatusStore = create<StatusStore>()(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,
      addCategory: (name) => {
        const color = BRANCH_COLORS[get().categories.length % BRANCH_COLORS.length]
        set((s) => ({ categories: [...s.categories, category(name, color, [])] }))
      },
      renameCategory: (id, name) => {
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, name } : c)),
        }))
      },
      recolorCategory: (id, color) => {
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, color } : c)),
        }))
      },
      deleteCategory: (id) => {
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
      },
      addItem: (categoryId, name) => {
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId ? { ...c, items: [...c.items, item(name, 50)] } : c,
          ),
        }))
      },
      updateItem: (categoryId, itemId, data) => {
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId
              ? { ...c, items: c.items.map((it) => (it.id === itemId ? { ...it, ...data } : it)) }
              : c,
          ),
        }))
      },
      deleteItem: (categoryId, itemId) => {
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId ? { ...c, items: c.items.filter((it) => it.id !== itemId) } : c,
          ),
        }))
      },
    }),
    { name: 'flowcraft-status' },
  ),
)
