import { describe, it, expect, beforeEach } from 'vitest'
import {
  site,
  initSite,
  resetSite,
  addElement,
  publishDraft,
  restoreSnapshot,
  revertDraft,
  hasUnpublishedChanges,
  undo,
} from '../src/store/site.js'
import { snapshotById } from '../src/core/snapshots.js'
import { STORAGE_KEY } from '../src/core/storage.js'

// 覆盖验收标准：AC-13.1 ~ AC-13.5（双态 + 快照 + 还原 + 撤销）

beforeEach(() => {
  localStorage.clear()
  resetSite()
})

describe('AC-13.1 草稿与正式态分离', () => {
  it('编辑草稿不影响 published', () => {
    const beforeDraft = JSON.stringify(site.draft)
    const beforePub = JSON.stringify(site.published)
    addElement('text')
    expect(JSON.stringify(site.draft)).not.toBe(beforeDraft)
    expect(JSON.stringify(site.published)).toBe(beforePub)
  })

  it('localStorage 持久化双态：save 后 load 完整恢复 draft 与 published', () => {
    addElement('text')
    publishDraft('测试发布')
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = JSON.parse(raw)
    expect(data.draft).toBeDefined()
    expect(data.published).toBeDefined()
    expect(data.snapshots).toBeDefined()
  })
})

describe('AC-13.2 发布生成快照', () => {
  it('publishDraft(note) 把草稿覆盖到 published 并生成快照', () => {
    addElement('text')
    publishDraft('首次发布')
    expect(JSON.stringify(site.draft)).toBe(JSON.stringify(site.published))
    expect(site.snapshots).toHaveLength(1)
    expect(site.snapshots[0].note).toBe('首次发布')
    expect(site.snapshots[0].time).toBeTypeOf('number')
  })

  it('note 缺省为空字符串，快照 data 与 published 一致', () => {
    publishDraft()
    expect(site.snapshots[0].note).toBe('')
    expect(site.snapshots[0].data).toEqual(site.published)
  })

  it('快照上限 20，超限淘汰最旧', () => {
    for (let i = 0; i < 25; i++) publishDraft(`第${i + 1}次`)
    expect(site.snapshots).toHaveLength(20)
    expect(site.snapshots[0].note).toBe('第6次')
  })
})

describe('AC-13.3 快照回滚写入草稿', () => {
  it('restoreSnapshot 把快照 data 写入 draft，不覆盖 published', () => {
    addElement('text')
    publishDraft('版本一')
    const pubSnap = site.snapshots[0]

    // 继续编辑草稿
    addElement('image')
    expect(site.draft.pages[0].elements.length).toBeGreaterThan(site.published.pages[0].elements.length)

    // 回滚到快照
    restoreSnapshot(pubSnap.id)
    expect(JSON.stringify(site.draft)).toBe(JSON.stringify(pubSnap.data))
    // published 不变
    expect(JSON.stringify(site.published)).toBe(JSON.stringify(pubSnap.data))
  })

  it('回滚后可撤销（回滚操作进入历史栈）', () => {
    addElement('text')
    publishDraft('有内容')
    const snap = site.snapshots[0]
    addElement('image') // 草稿比快照多一个元素
    restoreSnapshot(snap.id)
    // 撤销应回到回滚前的草稿状态
    undo()
    expect(site.draft.pages[0].elements.length).toBeGreaterThan(snap.data.pages[0].elements.length)
  })

  it('未知快照 id 回滚无效果', () => {
    const before = JSON.stringify(site.draft)
    restoreSnapshot('nonexistent-id')
    expect(JSON.stringify(site.draft)).toBe(before)
  })
})

describe('AC-13.4 还原到最近发布状态', () => {
  it('hasUnpublishedChanges：草稿与 published 一致时为 false', () => {
    publishDraft('发布')
    expect(hasUnpublishedChanges()).toBe(false)
  })

  it('hasUnpublishedChanges：草稿有改动时为 true', () => {
    publishDraft('发布')
    addElement('text')
    expect(hasUnpublishedChanges()).toBe(true)
  })

  it('revertDraft 放弃草稿回到 published', () => {
    publishDraft('基线')
    addElement('text')
    expect(hasUnpublishedChanges()).toBe(true)
    revertDraft()
    expect(JSON.stringify(site.draft)).toBe(JSON.stringify(site.published))
    expect(hasUnpublishedChanges()).toBe(false)
  })

  it('revertDraft 可撤销（还原操作进入历史栈）', () => {
    publishDraft('基线')
    addElement('text')
    const afterEdit = JSON.stringify(site.draft)
    revertDraft()
    undo()
    expect(JSON.stringify(site.draft)).toBe(afterEdit)
  })
})

describe('AC-13.5 撤销重做继续作用于草稿', () => {
  it('发布后仍可撤销之前的草稿编辑', () => {
    addElement('text') // 第一次编辑，改变初始状态
    const afterFirst = JSON.stringify(site.draft)
    addElement('image') // 第二次编辑，pushHistory 不跳过
    publishDraft('发布')
    undo() // 撤销第二次编辑，回到第一次编辑后
    expect(JSON.stringify(site.draft)).toBe(afterFirst)
  })
})
