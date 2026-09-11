import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { router } from '../src/router.js'
import { PAGE_KEYS, DEFAULT_PAGE_NAMES, normalizePages, pageAt, flattenPages } from '../src/core/pages.js'
import ShowcasePage from '../src/pages/showcase/ShowcasePage.vue'

// 覆盖验收标准：AC-10.1 ~ AC-10.3、AC-10.9

beforeEach(() => {
  localStorage.clear()
  window.location.hash = '#/'
})

describe('AC-10.1 多页路由站', () => {
  it('注册首页/作品集/项目/关于我四条展示路由与编辑器路由', () => {
    const paths = router.getRoutes().map((r) => r.path)
    for (const p of ['/', '/works', '/projects', '/about', '/editor']) {
      expect(paths, `缺少路由：${p}`).toContain(p)
    }
  })

  it('hash 路由模式，展示路由 meta.pageKey 与页面模型一一对应且组件懒加载', () => {
    const pairs = [['/', 'home'], ['/works', 'works'], ['/projects', 'projects'], ['/about', 'about']]
    for (const [path, key] of pairs) {
      const r = router.resolve(path)
      expect(r.href.startsWith('#'), `${path} 应为 hash 路由`).toBe(true)
      expect(r.meta.pageKey).toBe(key)
      expect(typeof r.matched[0].components.default, '展示页应懒加载分包').toBe('function')
    }
  })
})

describe('AC-10.2 页面模型', () => {
  it('PAGE_KEYS 固定四页，默认页名双语', () => {
    expect(PAGE_KEYS).toEqual(['home', 'works', 'projects', 'about'])
    expect(DEFAULT_PAGE_NAMES.home).toEqual({ zh: '首页', en: 'Home' })
    expect(DEFAULT_PAGE_NAMES.about).toEqual({ zh: '关于我', en: 'About' })
  })

  it('normalizePages 缺省补全四页并规范化字段', () => {
    const pages = normalizePages([])
    expect(pages.map((p) => p.key)).toEqual(PAGE_KEYS)
    for (const p of pages) {
      expect(p.pageHeight).toBe(100)
      expect(p.elements).toEqual([])
      expect(p.name.zh).toBeTruthy()
    }
  })

  it('normalizePages 过滤未知 key、名称归一化双语、pageHeight 钳制 100~500', () => {
    const el = { id: 'e1', type: 'text', x: 1, y: 1, w: 2, h: 2, z: 0, props: {} }
    const pages = normalizePages([
      { key: 'works', name: '作品集', pageHeight: 600, elements: [el] },
      { key: 'unknown-page' },
      { key: 'home', name: { zh: '主页', en: 'Home' }, pageHeight: 50 },
    ])
    expect(pages.map((p) => p.key)).toEqual(PAGE_KEYS)
    const works = pageAt(pages, 'works')
    expect(works.pageHeight).toBe(500)
    expect(works.name).toEqual({ zh: '作品集', en: '' })
    expect(works.elements).toHaveLength(1)
    expect(pageAt(pages, 'home').pageHeight).toBe(100)
  })

  it('pageAt 按 key 查找，未命中返回 null', () => {
    const pages = normalizePages([])
    expect(pageAt(pages, 'projects').key).toBe('projects')
    expect(pageAt(pages, 'nope')).toBeNull()
  })
})

describe('AC-10.2 多页合成单画布视图（导出适配）', () => {
  it('默认四页各 100：合成 pageHeight 400 + 四分区 0/25/50/75，元素 y/h 按页换算', () => {
    const pages = normalizePages([
      { key: 'works', elements: [{ id: 'a', type: 'text', x: 10, y: 10, w: 40, h: 20, z: 2, props: {} }] },
    ])
    const view = flattenPages({ theme: 'glass', pages })
    expect(view.pageHeight).toBe(400)
    expect(view.sections.map((s) => s.y)).toEqual([0, 25, 50, 75])
    expect(view.sections[1].name).toBe('作品集')
    expect(view.elements[0].y).toBeCloseTo(27.5) // 25 + 10 * (100/400)
    expect(view.elements[0].h).toBeCloseTo(5) // 20 * 0.25
    expect(view.elements[0].x).toBe(10)
    expect(view.theme).toBe('glass')
  })

  it('页高不一致时按 vh 占比换算', () => {
    const pages = normalizePages([
      { key: 'home', pageHeight: 200, elements: [{ id: 'a', type: 'text', x: 0, y: 10, w: 10, h: 10, z: 0, props: {} }] },
    ])
    const view = flattenPages({ pages })
    expect(view.pageHeight).toBe(500)
    expect(view.sections.map((s) => s.y)).toEqual([0, 40, 60, 80])
    expect(view.elements[0].y).toBeCloseTo(4) // 10 * (200/500)
    expect(view.elements[0].h).toBeCloseTo(4)
  })
})

describe('AC-10.3 顶部导航与高亮', () => {
  it('渲染四页链接 + 中英切换，当前页高亮', () => {
    window.location.hash = '#/'
    const w = mount(ShowcasePage, { props: { pageKey: 'home' } })
    expect(w.find('.nav-top').exists()).toBe(true)
    const links = w.findAll('.nav-link')
    expect(links).toHaveLength(4)
    expect(links[0].classes()).toContain('active')
    expect(w.text()).toContain('作品集')
    expect(w.text()).toContain('EN')
    w.unmount()
  })

  it('路由变化时高亮跟随', () => {
    window.location.hash = '#/works'
    const w = mount(ShowcasePage, { props: { pageKey: 'works' } })
    const links = w.findAll('.nav-link')
    expect(links[1].classes()).toContain('active')
    w.unmount()
    window.location.hash = '#/'
  })
})

describe('AC-10.9 兜底重定向', () => {
  it('未匹配路由重定向回首页', () => {
    const r = router.resolve('/not-exist-page')
    expect(r.matched[0].path).toBe('/:pathMatch(.*)*')
    expect(r.matched[0].redirect).toBe('/')
  })
})

describe('AC-10.2 路由切换渲染对应页（集成：meta.pageKey 须传入组件）', () => {
  it('经真实 router-view 导航后，页面内容随路由切换', async () => {
    const App = (await import('../src/App.vue')).default
    const { flushPromises } = await import('@vue/test-utils')
    window.location.hash = '#/'
    const w = mount(App, { global: { plugins: [router] } })
    await router.isReady()
    await flushPromises()
    expect(w.text()).toContain('以热爱 · 创造体验')
    await router.push('/works')
    await flushPromises()
    expect(w.text()).toContain('精选作品')
    expect(w.text()).not.toContain('以热爱 · 创造体验')
    await router.push('/about')
    await flushPromises()
    expect(w.text()).toContain('关于我')
    await router.push('/')
    await flushPromises()
    expect(w.text()).toContain('以热爱 · 创造体验')
    w.unmount()
    window.location.hash = '#/'
  })
})

describe('AC-10.10 滚动到底向下滚轮进入下一页', () => {
  it('首页/作品集/项目页有纯文本「↓ 往下探索」提示，首页无站内链接元素', async () => {
    const { site } = await import('../src/store/site.js')
    for (const key of ['home', 'works', 'projects']) {
      const pg = site.published.pages.find((p) => p.key === key)
      const hint = pg.elements.find(
        (e) => e.type === 'text' && JSON.stringify(e.props.content || '').includes('往下探索'),
      )
      expect(hint, `${key} 缺少滚动提示`).toBeTruthy()
      expect(hint.props.url).toBeUndefined()
    }
    const home = site.published.pages.find((p) => p.key === 'home')
    const hasInSiteLink = home.elements.some(
      (e) => e.type === 'link' && String(e.props.url || '').startsWith('#/'),
    )
    expect(hasInSiteLink).toBe(false)
  })

  it('页面到底后向下滚轮进入下一页（首页→作品集→项目），冷却期内不连跳', async () => {
    const App = (await import('../src/App.vue')).default
    const { flushPromises } = await import('@vue/test-utils')
    vi.useFakeTimers()
    try {
      window.location.hash = '#/'
      const w = mount(App, { global: { plugins: [router] } })
      await router.isReady()
      await flushPromises()
      const wheel = (d) => window.dispatchEvent(new window.WheelEvent('wheel', { deltaY: d }))
      wheel(160)
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/works')
      wheel(160)
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/works')
      vi.advanceTimersByTime(1300)
      wheel(160)
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/projects')
      w.unmount()
    } finally {
      vi.useRealTimers()
      window.location.hash = '#/'
    }
  })
})
