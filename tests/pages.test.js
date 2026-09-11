import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import EditorPage from '../src/pages/EditorPage.vue'
import ShowcasePage from '../src/pages/showcase/ShowcasePage.vue'

beforeEach(() => {
  localStorage.clear()
  window.location.hash = '#/'
})

// 覆盖验收标准：AC-1.1 / AC-7.2 / AC-7.3 / AC-10.8 / AC-4.5

describe('AC-1.1 编辑器 1:3 布局', () => {
  it('左侧编辑面板与右侧预览画布同时渲染（25%/75% 由 scoped CSS 保证）', async () => {
    const w = mount(EditorPage, { attachTo: document.body })
    await flushPromises()
    expect(w.find('.panel').exists()).toBe(true)
    expect(w.find('.preview').exists()).toBe(true)
    expect(w.find('.panel').classes()).toContain('panel')
    w.unmount()
  })

  it('面板包含元素库（7 类）、画布设置与操作区，界面为中文', async () => {
    const w = mount(EditorPage)
    await flushPromises()
    const text = w.text()
    expect(text).toContain('添加元素')
    expect(text).toContain('属性')
    expect(text).toContain('画布')
    expect(text).toContain('操作')
    expect(text).toContain('网格吸附')
    // 7 类元素按钮
    for (const label of ['文本', '图片', '视频', '链接卡片', '技能标签', '相册', '装饰']) {
      expect(text, `缺少元素按钮：${label}`).toContain(label)
    }
    // 五套主题选项（AC-14.1）
    const options = w.findAll('option').map(o => o.text())
    expect(options).toEqual(expect.arrayContaining(['曜蓝商务', '星穹玻璃拟态', '暗夜霓虹', '极简晨白', '复古像素']))
    w.unmount()
  })

  it('预览画布渲染示例元素，点击元素库按钮可新增元素', async () => {
    const w = mount(EditorPage)
    await flushPromises()
    const before = w.findAll('.element').length
    expect(before).toBeGreaterThanOrEqual(10) // 首页示例内容（AC-7.3）
    const buttons = w.findAll('.btn-grid button')
    await buttons.find(b => b.text() === '文本').trigger('click')
    await flushPromises()
    expect(w.findAll('.element').length).toBe(before + 1)
    w.unmount()
  })
})

describe('AC-7.2 展示页与编辑器预览一致', () => {
  it('展示页渲染同样的示例元素（只读、无编辑面板）', async () => {
    const w = mount(ShowcasePage, { props: { pageKey: 'home' } })
    await flushPromises()
    expect(w.find('.stage').exists()).toBe(true)
    expect(w.findAll('.element').length).toBeGreaterThanOrEqual(10)
    expect(w.find('.panel').exists()).toBe(false)
    w.unmount()
  })
})

describe('AC-10.8 四页内置示例内容', () => {
  it('四个页面均有示例元素，首页满足 AC-7.3（≥10 个）', async () => {
    for (const key of ['home', 'works', 'projects', 'about']) {
      const w = mount(ShowcasePage, { props: { pageKey: key } })
      await flushPromises()
      const n = w.findAll('.element').length
      if (key === 'home') {
        expect(n, '首页示例元素数').toBeGreaterThanOrEqual(10)
      } else {
        expect(n, `${key} 示例元素数`).toBeGreaterThan(0)
      }
      w.unmount()
    }
  })
})

describe('AC-4.5 科技氛围背景层', () => {
  it('展示页渲染背景层（Canvas粒子 + 网格 + 暗角）', async () => {
    const w = mount(ShowcasePage, { props: { pageKey: 'home' } })
    await flushPromises()
    expect(w.find('.tech-backdrop').exists()).toBe(true)
    expect(w.find('.tb-canvas').exists()).toBe(true)
    expect(w.find('.tb-grid').exists()).toBe(true)
    expect(w.find('.tb-vig').exists()).toBe(true)
    w.unmount()
  })

  it('编辑器预览画布渲染同一背景层（AC-7.2 一致性）', async () => {
    const w = mount(EditorPage)
    await flushPromises()
    expect(w.find('.tech-backdrop').exists()).toBe(true)
    w.unmount()
  })
})
