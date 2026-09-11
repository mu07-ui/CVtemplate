import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { BREAKPOINTS, deviceOf, adaptLayout } from '../src/core/responsive.js'
import MobileTabBar from '../src/components/MobileTabBar.vue'
import ShowcasePage from '../src/pages/showcase/ShowcasePage.vue'
import EditorPage from '../src/pages/EditorPage.vue'
import { resetSite, initSite } from '../src/store/site.js'

// 覆盖验收标准：AC-11.1 / AC-11.2 / AC-11.4 / AC-11.5

/** 改写视口宽度并派发 resize（jsdom 环境） */
function setWidth(w) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: w })
  window.dispatchEvent(new Event('resize'))
}

beforeEach(() => {
  localStorage.clear()
  resetSite()
})
afterEach(() => setWidth(1024))

describe('AC-11.1 三端断点判定（纯逻辑）', () => {
  it('断点常量：手机 <640 / 平板 640~1023 / PC ≥1024', () => {
    expect(BREAKPOINTS.MOBILE).toBe(640)
    expect(BREAKPOINTS.TABLET).toBe(1024)
  })

  it('deviceOf 按宽度返回 mobile/tablet/pc', () => {
    expect(deviceOf(375)).toBe('mobile')
    expect(deviceOf(639)).toBe('mobile')
    expect(deviceOf(640)).toBe('tablet')
    expect(deviceOf(1023)).toBe('tablet')
    expect(deviceOf(1024)).toBe('pc')
    expect(deviceOf(1600)).toBe('pc')
  })
})

describe('AC-11.4 断点切换元素占比不变（百分比存储保证）', () => {
  const elements = [
    { id: 'a', type: 'text', x: 8, y: 6.5, w: 40, h: 3 },
    { id: 'b', type: 'image', x: 52, y: 13, w: 40, h: 6.5 },
  ]

  it('adaptLayout 在三端均不改变 x/y/w/h', () => {
    for (const device of ['mobile', 'tablet', 'pc']) {
      const out = adaptLayout(elements, device)
      expect(out.map((e) => [e.x, e.y, e.w, e.h])).toEqual([
        [8, 6.5, 40, 3],
        [52, 13, 40, 6.5],
      ])
    }
  })

  it('adaptLayout 返回新数组且坐标仍在 0~100', () => {
    const out = adaptLayout(elements, 'mobile')
    expect(out).not.toBe(elements)
    for (const e of out) {
      for (const k of ['x', 'y', 'w', 'h']) {
        expect(e[k]).toBeGreaterThanOrEqual(0)
        expect(e[k]).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('AC-11.2 手机底部标签栏组件', () => {
  it('渲染四个页签，当前页高亮，链接为 hash 路由', () => {
    const w = mount(MobileTabBar, { props: { pageKey: 'works' } })
    const tabs = w.findAll('.tab-item')
    expect(tabs).toHaveLength(4)
    const active = w.findAll('.tab-item.active')
    expect(active).toHaveLength(1)
    expect(active[0].text()).toContain('作品集')
    const hrefs = tabs.map((t) => t.attributes('href'))
    expect(hrefs).toEqual(['#/', '#/works', '#/projects', '#/about'])
  })
})

describe('AC-11.2 / AC-10.3 展示页按断点切换导航形态', () => {
  it('PC 宽屏渲染顶部导航，不渲染底部标签栏', async () => {
    setWidth(1200)
    const w = mount(ShowcasePage, { props: { pageKey: 'home' } })
    await w.vm.$nextTick()
    expect(w.find('.nav-top').exists()).toBe(true)
    expect(w.find('.tab-bar').exists()).toBe(false)
    w.unmount()
  })

  it('手机窄屏渲染固定底部标签栏，不渲染顶部导航', async () => {
    setWidth(375)
    const w = mount(ShowcasePage, { props: { pageKey: 'home' } })
    await w.vm.$nextTick()
    expect(w.find('.tab-bar').exists()).toBe(true)
    expect(w.find('.nav-top').exists()).toBe(false)
    expect(w.findAll('.tab-item')).toHaveLength(4)
    w.unmount()
  })

  it('视口实时变化时导航形态跟随切换', async () => {
    setWidth(1200)
    const w = mount(ShowcasePage, { props: { pageKey: 'home' } })
    await w.vm.$nextTick()
    expect(w.find('.nav-top').exists()).toBe(true)
    setWidth(500)
    await w.vm.$nextTick()
    expect(w.find('.tab-bar').exists()).toBe(true)
    expect(w.find('.nav-top').exists()).toBe(false)
    w.unmount()
  })
})

describe('AC-11.5 工坊窄屏提示', () => {
  it('窄屏访问 /editor：显示中文提示且不渲染编辑面板与画布', async () => {
    initSite()
    setWidth(375)
    const w = mount(EditorPage)
    await w.vm.$nextTick()
    expect(w.find('.narrow-tip').exists()).toBe(true)
    expect(w.text()).toContain('建议使用电脑编辑')
    expect(w.text()).not.toContain('作品集编辑器')
    expect(w.find('.panel').exists()).toBe(false)
    expect(w.find('.stage').exists()).toBe(false)
    w.unmount()
  })

  it('PC 宽屏正常渲染工坊（无窄屏提示）', async () => {
    initSite()
    setWidth(1280)
    const w = mount(EditorPage)
    await w.vm.$nextTick()
    expect(w.find('.narrow-tip').exists()).toBe(false)
    expect(w.find('.panel').exists()).toBe(true)
    expect(w.find('.stage').exists()).toBe(true)
    w.unmount()
  })
})
