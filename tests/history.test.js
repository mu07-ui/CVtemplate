import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createHistory } from '../src/core/history.js'
import { site, resetSite, clearSelection, selectedId } from '../src/store/site.js'

// 覆盖验收标准：AC-5.1 ~ AC-5.3

beforeEach(() => {
  localStorage.clear()
  resetSite()
  clearSelection()
})

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

describe('AC-5.3 快捷键不干扰文本输入（属性面板 Backspace 缺陷回归）', () => {
  it('输入框持有焦点时按 Backspace 只删字符，不删除选中元素；非输入焦点仍可删除', async () => {
    const { default: EditorPage } = await import('../src/pages/EditorPage.vue')
    const w = mount(EditorPage)
    await w.vm.$nextTick()
    const el = site.draft.pages[0].elements[0]
    selectedId.value = el.id

    // 模拟属性面板输入框持有焦点时按键（事件从 input 冒泡到 window）
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    input.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
    )
    expect(site.draft.pages[0].elements.some((x) => x.id === el.id)).toBe(true)

    // 焦点不在输入框时：原删除行为保留
    input.remove()
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Backspace', cancelable: true }))
    expect(site.draft.pages[0].elements.some((x) => x.id === el.id)).toBe(false)
    w.unmount()
  })

  it('输入框内方向键/其他字符不触发元素微调与删除', async () => {
    const { default: EditorPage } = await import('../src/pages/EditorPage.vue')
    const w = mount(EditorPage)
    await w.vm.$nextTick()
    const el = site.draft.pages[0].elements[0]
    selectedId.value = el.id
    const before = { x: el.x, y: el.y }

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    // shift+方向键步长为 1，若无守卫必然产生位移
    input.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true, cancelable: true }),
    )
    input.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true }),
    )
    for (const key of ['ArrowDown', 'ArrowLeft', 'd']) {
      input.dispatchEvent(
        new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      )
    }
    const after = site.draft.pages[0].elements.find((x) => x.id === el.id)
    expect(after.x).toBe(before.x)
    expect(after.y).toBe(before.y)
    expect(site.draft.pages[0].elements.some((x) => x.id === el.id)).toBe(true)
    input.remove()
    w.unmount()
  })
})
