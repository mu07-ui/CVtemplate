import { describe, it, expect } from 'vitest'
import { createHistory } from '../src/core/history.js'

// 覆盖验收标准：AC-5.1 ~ AC-5.2

describe('AC-5.1 撤销与重做', () => {
  it('初始状态：不可撤销也不可重做', () => {
    const h = createHistory()
    expect(h.canUndo()).toBe(false)
    expect(h.canRedo()).toBe(false)
  })

  it('push 后可撤销（应用层会预压初始快照，两个快照间即可回退）', () => {
    const h = createHistory()
    h.push({ step: 1 })
    h.push({ step: 2 })
    expect(h.canUndo()).toBe(true)
    expect(h.undo()).toEqual({ step: 1 })
  })

  it('undo 返回上一状态，redo 恢复', () => {
    const h = createHistory()
    h.push({ step: 1 })
    h.push({ step: 2 })
    h.push({ step: 3 })

    expect(h.undo()).toEqual({ step: 2 })
    expect(h.redo()).toEqual({ step: 3 })
    expect(h.undo()).toEqual({ step: 2 })
    expect(h.undo()).toEqual({ step: 1 })
    expect(h.canUndo()).toBe(false)
  })

  it('undo 后 push 新状态会截断重做分支', () => {
    const h = createHistory()
    h.push({ step: 1 })
    h.push({ step: 2 })
    h.undo()
    h.push({ step: 'new' })
    expect(h.canRedo()).toBe(false)
    expect(h.undo()).toEqual({ step: 1 })
  })
})

describe('AC-5.2 历史栈上限 50 条', () => {
  it('超过 50 条后丢弃最旧记录，undo 仍可用', () => {
    const h = createHistory()
    for (let i = 1; i <= 60; i++) {
      h.push({ step: i })
    }
    // 栈中应只剩最新 50 条（step 11 ~ 60），最多可回退 49 步
    for (let i = 0; i < 48; i++) {
      h.undo()
    }
    expect(h.undo()).toEqual({ step: 11 })
    expect(h.canUndo()).toBe(false)
  })
})
