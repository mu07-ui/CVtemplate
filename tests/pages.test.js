import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import EditorPage from '../src/pages/EditorPage.vue'
import DisplayPage from '../src/pages/DisplayPage.vue'

beforeEach(() => {
  localStorage.clear()
})

// 覆盖验收标准：AC-1.1 / AC-1.2 / AC-7.3

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
    // 三套主题选项
    const options = w.findAll('option').map(o => o.text())
    expect(options).toEqual(expect.arrayContaining(['商务稳重', '玻璃拟态', '复古像素']))
    w.unmount()
  })

  it('预览画布渲染示例元素，点击元素库按钮可新增元素', async () => {
    const w = mount(EditorPage)
    await flushPromises()
    const before = w.findAll('.element').length
    expect(before).toBeGreaterThanOrEqual(10) // 示例内容（AC-7.3）
    const buttons = w.findAll('.btn-grid button')
    await buttons.find(b => b.text() === '文本').trigger('click')
    await flushPromises()
    expect(w.findAll('.element').length).toBe(before + 1)
    w.unmount()
  })
})

describe('AC-7.2 展示页与编辑器预览一致', () => {
  it('展示页渲染同样的示例元素（只读、无编辑面板）', async () => {
    const w = mount(DisplayPage)
    await flushPromises()
    expect(w.find('.stage').exists()).toBe(true)
    expect(w.findAll('.element').length).toBeGreaterThanOrEqual(10)
    expect(w.find('.panel').exists()).toBe(false)
    w.unmount()
  })
})

describe('AC-9.2 分区分页导航', () => {
  it('展示页渲染分页组件：页码指示器 + 上一页/下一页按钮，页码含分区名', async () => {
    const w = mount(DisplayPage)
    await flushPromises()
    expect(w.find('.sec-nav').exists()).toBe(true)
    const nums = w.findAll('.sec-num')
    expect(nums.length).toBe(4) // 示例四分区：首页/作品/案例/项目
    expect(w.find('.sec-prev').exists()).toBe(true)
    expect(w.find('.sec-next').exists()).toBe(true)
    const text = w.text()
    for (const name of ['首页', '作品', '案例', '项目']) {
      expect(text).toContain(name)
    }
    expect(nums[0].classes()).toContain('active') // 初始高亮第一页
    w.unmount()
  })

  it('未配置分区时不渲染分页组件', async () => {
    const { site: siteState } = await import('../src/store/site.js')
    siteState.sections = []
    const w = mount(DisplayPage)
    await flushPromises()
    expect(w.find('.sec-nav').exists()).toBe(false)
    w.unmount()
    siteState.sections = [{ name: '首页', y: 0 }, { name: '作品', y: 25 }, { name: '案例', y: 50 }, { name: '项目', y: 75 }]
  })
})

describe('AC-4.5 科技氛围背景层', () => {
  it('展示页渲染背景层（网格/星座连线/暗角三分层）', async () => {
    const w = mount(DisplayPage)
    await flushPromises()
    expect(w.find('.tech-backdrop').exists()).toBe(true)
    expect(w.find('.tb-grid').exists()).toBe(true)
    expect(w.find('.tb-net').exists()).toBe(true)
    expect(w.find('.tb-vignette').exists()).toBe(true)
    w.unmount()
  })

  it('编辑器预览画布渲染同一背景层（AC-7.2 一致性）', async () => {
    const w = mount(EditorPage)
    await flushPromises()
    expect(w.find('.tech-backdrop').exists()).toBe(true)
    w.unmount()
  })
})
