import { describe, it, expect } from 'vitest'
import {
  MAX_SNAPSHOTS,
  createSnapshot,
  pushSnapshot,
  normalizeSnapshots,
  snapshotById,
} from '../src/core/snapshots.js'

// 覆盖验收标准：AC-13.2（快照 CRUD / 上限淘汰 / 规范化）

const published = { theme: 'glass', pages: [{ key: 'home', elements: [] }] }

describe('AC-13.2 快照生成', () => {
  it('createSnapshot 产出含 id / time / note / data 的快照对象', () => {
    const snap = createSnapshot(published, '首次发布')
    expect(snap.id).toBeTruthy()
    expect(typeof snap.time).toBe('number')
    expect(snap.note).toBe('首次发布')
    expect(snap.data).toEqual(published)
  })

  it('note 缺省为空字符串；data 为 published 的深拷贝（不引用同一对象）', () => {
    const snap = createSnapshot(published)
    expect(snap.note).toBe('')
    expect(snap.data).not.toBe(published)
    expect(snap.data).toEqual(published)
  })

  it('每次生成 id 唯一', () => {
    const ids = new Set([createSnapshot(published).id, createSnapshot(published).id, createSnapshot(published).id])
    expect(ids.size).toBe(3)
  })
})

describe('AC-13.2 快照追加与上限淘汰', () => {
  it('pushSnapshot 追加到列表末尾', () => {
    const list = []
    const snap = createSnapshot(published, 'a')
    const next = pushSnapshot(list, snap)
    expect(next).toHaveLength(1)
    expect(next[0].id).toBe(snap.id)
  })

  it('上限 20 个，超限淘汰最旧（FIFO）', () => {
    let list = []
    for (let i = 0; i < 25; i++) list = pushSnapshot(list, createSnapshot(published, `第${i + 1}次`))
    expect(list).toHaveLength(MAX_SNAPSHOTS)
    expect(MAX_SNAPSHOTS).toBe(20)
    expect(list[0].note).toBe('第6次') // 最旧 5 个被淘汰
    expect(list[list.length - 1].note).toBe('第25次')
  })

  it('pushSnapshot 不修改原数组（返回新数组）', () => {
    const list = []
    pushSnapshot(list, createSnapshot(published))
    expect(list).toHaveLength(0)
  })
})

describe('AC-13.2 快照规范化', () => {
  it('normalizeSnapshots 过滤无 id 项、补全 note / data 字段', () => {
    const raw = [
      createSnapshot(published, '正常'),
      { id: 'x', time: 1 }, // 缺 data → 补全
      null,
      { id: 'y', time: 2, note: '无数据', data: null }, // data: null → 补全
    ]
    const list = normalizeSnapshots(raw)
    expect(list).toHaveLength(3)
    expect(list.every((s) => s.data && typeof s.note === 'string')).toBe(true)
  })

  it('normalizeSnapshots 非数组输入返回空数组', () => {
    expect(normalizeSnapshots(null)).toEqual([])
    expect(normalizeSnapshots('oops')).toEqual([])
  })
})

describe('AC-13.2 快照查找', () => {
  it('snapshotById 按 id 查找，未命中返回 null', () => {
    const list = normalizeSnapshots([createSnapshot(published, 'a')])
    const id = list[0].id
    expect(snapshotById(list, id).note).toBe('a')
    expect(snapshotById(list, 'nope')).toBeNull()
  })
})
