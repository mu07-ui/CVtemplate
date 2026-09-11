import { describe, it, expect, vi } from 'vitest'
import { buildStandaloneHtml, buildSiteZip } from '../src/core/exportSite.js'
import { renderSiteInto } from '../src/export/viewer-runtime.js'
import { buildResumeHtml } from '../src/core/resume.js'
import { THEMES } from '../src/core/theme.js'
import {
  createText, createImage, createVideo, createLink,
  createSkillTag, createGallery, createDecoration,
} from '../src/core/schema.js'
import JSZip from 'jszip'

function sampleSite() {
  return {
    theme: 'glass',
    elements: [
      createText({ content: '张三', fontSize: 34, x: 20, y: 7, w: 30, h: 8, z: 2 }),
      createText({ content: '热爱用代码与设计表达想法，专注交互体验与可视化呈现。', fontSize: 15, x: 20, y: 15, w: 45, h: 10, z: 3 }),
      createSkillTag({ tags: ['Vue', 'TypeScript'], x: 20, y: 26, w: 40, h: 6, z: 4 }),
      createGallery({
        images: [
          { src: 'data:image/png;base64,AAA', caption: '作品一' },
          { src: 'data:image/png;base64,BBB', caption: '作品二' },
        ],
        x: 6, y: 43, w: 60, h: 26, z: 6,
      }),
      createVideo({ source: 'link', url: 'https://www.bilibili.com/video/BV1xx411c7mD', x: 68, y: 43, w: 26, h: 15, z: 7 }),
      createLink({ title: 'GitHub 主页', url: 'https://github.com/me', x: 68, y: 60, w: 26, h: 9, z: 8 }),
      createImage({ src: 'data:image/png;base64,CCC', x: 6, y: 6, w: 11, h: 15, z: 1 }),
      createDecoration({ shape: 'line', color: '#2f54eb', opacity: 0.6, x: 6, y: 34, w: 88, h: 0.6, z: 4 }),
    ],
  }
}

// 覆盖验收标准：AC-6.5 / AC-6.6（v1 视图沿用至 v2 多页路由落地前的过渡期）

describe('AC-6.5 独立展示页 HTML', () => {
  it('包含 doctype、主题变量、内联运行时与全部内容', () => {
    const html = buildStandaloneHtml(sampleSite())
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain(THEMES.glass.background)
    expect(html).toContain('张三')
    expect(html).toContain('renderSiteInto')
    expect(html).toContain('site-data')
  })

  it('纵向画布：pageHeight 注入为 vh 高度，含氛围背景与进场动画', () => {
    const html = buildStandaloneHtml({ ...sampleSite(), pageHeight: 260 })
    expect(html).toContain('260vh')
    expect(html).toContain('gradient')
    expect(html).toContain('v-in')
  })

  it('视频外链在导出时预解析为嵌入地址', () => {
    const html = buildStandaloneHtml(sampleSite())
    expect(html).toContain('player.bilibili.com/player.html?bvid=BV1xx411c7mD')
  })

  it('嵌入数据转义 < 防止脚本截断', () => {
    const site = { theme: 'business', elements: [createText({ content: '<script>alert(1)</script>' })] }
    const html = buildStandaloneHtml(site)
    expect(html).not.toContain('<script>alert(1)')
    expect(html).toContain('\\u003cscript')
  })

  it('无法解析的视频外链保留原样、不抛错', () => {
    const site = {
      theme: 'business',
      elements: [createVideo({ source: 'link', url: 'https://example.com/v/1' })],
    }
    expect(() => buildStandaloneHtml(site)).not.toThrow()
    expect(buildStandaloneHtml(site)).toContain('example.com/v/1')
  })

  it('导出页包含科技氛围背景层（AC-4.5）', () => {
    const html = buildStandaloneHtml(sampleSite())
    expect(html).toContain('v-tech')
    expect(html).toContain('vt-grid')
    expect(html).toContain('vt-net')
    expect(html).toContain('vt-vig')
  })
})

describe('导出页运行时（与编辑器渲染逻辑对齐）', () => {
  it('jsdom 中渲染出全部元素，外链带 target=_blank 与 rel=noopener', () => {
    const root = document.createElement('div')
    renderSiteInto(root, { elements: sampleSite().elements })
    expect(root.querySelectorAll('.v-el')).toHaveLength(8)
    const a = root.querySelector('.v-link')
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('rel')).toBe('noopener')
    expect(a.getAttribute('href')).toBe('https://github.com/me')
    expect(root.querySelectorAll('.v-tag')).toHaveLength(2)
    expect(root.querySelectorAll('.v-gitem')).toHaveLength(2)
    expect(root.textContent).toContain('张三')
  })

  it('运行时函数自包含：源码中无 import/require 引用', () => {
    const src = renderSiteInto.toString()
    expect(src).not.toMatch(/\b(import|require)\b/)
  })
})

describe('AC-6.5 静态站 ZIP 打包', () => {
  it('包含 index.html / data.json / 部署说明，数据可再导入', async () => {
    // v2 站点数据：元素按页存放，导出 data.json 为 v2 契约
    const els = sampleSite().elements
    const pages = [
      { key: 'home', name: { zh: '首页', en: 'Home' }, pageHeight: 100, elements: els.slice(0, 4) },
      { key: 'works', name: { zh: '作品集', en: 'Works' }, pageHeight: 100, elements: els.slice(4) },
    ]
    const v2Site = {
      locale: 'zh',
      motion: { level: 'standard' },
      published: { theme: 'glass', pages: JSON.parse(JSON.stringify(pages)) },
      draft: { theme: 'glass', pages },
      snapshots: [],
    }
    const buf = await buildSiteZip(v2Site, 'uint8array')
    const zip = await JSZip.loadAsync(buf)
    expect(Object.keys(zip.files)).toEqual(expect.arrayContaining(['index.html', 'data.json', '部署说明.txt']))

    const html = await zip.file('index.html').async('string')
    expect(html).toContain('<!doctype html>')

    const json = JSON.parse(await zip.file('data.json').async('string'))
    expect(json.version).toBe(2)
    expect(json.draft.pages[0].elements).toHaveLength(4)
    expect(json.draft.pages[1].elements).toHaveLength(4)
    expect(json.published.theme).toBe('glass')

    const readme = await zip.file('部署说明.txt').async('string')
    expect(readme).toContain('部署')
  })
})

describe('AC-6.6 A4 简历模板', () => {
  it('抽取姓名（最大字号文本）/简介/技能/链接/作品缩略图', () => {
    const html = buildResumeHtml(sampleSite())
    expect(html).toContain('张三')
    expect(html).toContain('热爱用代码与设计表达想法')
    expect(html).toContain('Vue')
    expect(html).toContain('github.com/me')
    expect(html).toContain('data:image/png;base64,AAA')
  })

  it('为 A4 页面规格并含自动打印脚本', () => {
    const html = buildResumeHtml(sampleSite())
    expect(html).toContain('@page')
    expect(html).toContain('size: A4')
    expect(html).toContain('window.print()')
  })

  it('空站点数据生成兜底内容且不抛错', () => {
    const html = buildResumeHtml({ elements: [], theme: 'business' })
    expect(html).toContain('姓名')
    expect(html).toContain('暂无简介')
  })
})

// ── AC-18 打包部署 v2 ───────────────────────────────────────────

function v2MultiSite() {
  const mk = (zh, en) => createText({ content: { zh, en }, x: 10, y: 10, w: 80, h: 5 })
  const pages = [
    { key: 'home', name: { zh: '首页', en: 'Home' }, pageHeight: 100, elements: [mk('你好世界', 'Hello World')] },
    { key: 'works', name: { zh: '作品集', en: 'Works' }, pageHeight: 120, elements: [mk('作品列表', 'Works List')] },
    { key: 'projects', name: { zh: '项目', en: 'Projects' }, pageHeight: 100, elements: [createText({ content: '项目案例', x: 10, y: 10, w: 80, h: 5 })] },
    { key: 'about', name: { zh: '关于我', en: 'About' }, pageHeight: 100, elements: [mk('关于我', '')] },
  ]
  return {
    locale: 'zh',
    motion: { level: 'standard' },
    published: { theme: 'glass', pages: JSON.parse(JSON.stringify(pages)) },
    draft: { theme: 'glass', pages },
    snapshots: [],
  }
}

function gotoHash(h) {
  window.location.hash = h
  window.dispatchEvent(new window.Event('hashchange'))
}

describe('AC-18 导出包四页 hash 路由运行时', () => {
  it('默认渲染首页与四页导航（含中英切换）', () => {
    const root = document.createElement('div')
    renderSiteInto(root, v2MultiSite().draft)
    expect(root.textContent).toContain('你好世界')
    expect(root.textContent).not.toContain('作品列表')
    expect(root.querySelectorAll('.v-nav-link')).toHaveLength(4)
    expect(root.querySelector('[data-lang="en"]')).toBeTruthy()
  })

  it('hash 切换渲染对应页并高亮当前页', () => {
    const root = document.createElement('div')
    renderSiteInto(root, v2MultiSite().draft)
    gotoHash('#/works')
    expect(root.textContent).toContain('作品列表')
    expect(root.textContent).not.toContain('你好世界')
    const active = root.querySelectorAll('.v-nav-link.active')
    expect(active).toHaveLength(1)
    expect(active[0].getAttribute('href')).toBe('#/works')
    gotoHash('#/')
    expect(root.textContent).toContain('你好世界')
  })

  it('未匹配 hash 回退首页', () => {
    const root = document.createElement('div')
    renderSiteInto(root, v2MultiSite().draft)
    gotoHash('#/nope')
    expect(root.textContent).toContain('你好世界')
  })

  it('中英切换实时重渲染；英文缺失回退中文（AC-18.4 离线双语）', async () => {
    const root = document.createElement('div')
    renderSiteInto(root, v2MultiSite().draft)
    root.querySelector('[data-lang="en"]').dispatchEvent(new window.Event('click', { bubbles: true }))
    expect(root.textContent).toContain('Hello World')
    expect(root.textContent).not.toContain('你好世界')
    gotoHash('#/works')
    expect(root.textContent).toContain('Works List')
    // about 页英文为空 → 回退中文
    gotoHash('#/about')
    expect(root.textContent).toContain('关于我')
    // 纯字符串字段两种语言同文
    gotoHash('#/projects')
    expect(root.textContent).toContain('项目案例')
    window.location.hash = '#/'
  })

  it('AC-10.10 站内 hash 链接渲染：无 target、不展示 url 明文；外链保留 target 与 url', () => {
    const state = v2MultiSite()
    state.draft.pages[0].elements.push(
      createLink({ title: { zh: '↓ 往下探索', en: '↓ Explore' }, url: '#/works', x: 38, y: 88, w: 24, h: 2.6 })
    )
    const root = document.createElement('div')
    renderSiteInto(root, state.draft)
    const inSite = root.querySelector('a.v-link[href="#/works"]')
    expect(inSite).toBeTruthy()
    expect(inSite.getAttribute('target')).toBeNull()
    expect(inSite.textContent).toContain('↓ 往下探索')
    expect(inSite.textContent).not.toContain('#/works')
    // 外链行为不变（对照）
    state.draft.pages[0].elements.push(
      createLink({ title: { zh: 'GitHub 主页 →', en: 'GitHub →' }, url: 'https://github.com', x: 33, y: 67.5, w: 34, h: 4.8 })
    )
    const root2 = document.createElement('div')
    renderSiteInto(root2, state.draft)
    const outer = root2.querySelector('a.v-link[href="https://github.com"]')
    expect(outer.getAttribute('target')).toBe('_blank')
    expect(outer.textContent).toContain('https://github.com')
  })

  it('AC-10.10 滚动到底向下滚轮进入下一页（首页→作品集→项目），冷却期内不连跳', () => {
    vi.useFakeTimers()
    try {
      const root = document.createElement('div')
      document.body.appendChild(root)
      renderSiteInto(root, v2MultiSite().draft)
      expect(root.textContent).toContain('你好世界')
      const wheel = (d) => window.dispatchEvent(new window.WheelEvent('wheel', { deltaY: d }))
      wheel(160)
      expect(window.location.hash).toBe('#/works')
      gotoHash('#/works')
      expect(root.textContent).toContain('作品列表')
      wheel(160)
      expect(window.location.hash).toBe('#/works')
      vi.advanceTimersByTime(1300)
      wheel(160)
      expect(window.location.hash).toBe('#/projects')
      gotoHash('#/projects')
      expect(root.textContent).toContain('项目案例')
    } finally {
      vi.useRealTimers()
      window.location.hash = '#/'
    }
  })
})

describe('AC-18 部署包内容', () => {
  it('ZIP 含四页全量双语文案与部署指引页（GitHub Pages / Vercel）', async () => {
    const buf = await buildSiteZip(v2MultiSite(), 'uint8array')
    const zip = await JSZip.loadAsync(buf)
    expect(Object.keys(zip.files)).toEqual(expect.arrayContaining(['index.html', 'data.json', '部署指引.html']))
    const html = await zip.file('index.html').async('string')
    // 四页双语均嵌入（未提前解析语言）
    for (const t of ['你好世界', 'Hello World', '作品列表', 'Works List', '关于我']) {
      expect(html).toContain(t)
    }
    const guide = await zip.file('部署指引.html').async('string')
    expect(guide).toContain('GitHub Pages')
    expect(guide).toContain('Vercel')
  })

  it('index.html 含粒子运行时与四页 hash 路由、手机底部标签栏样式', async () => {
    const buf = await buildSiteZip(v2MultiSite(), 'uint8array')
    const zip = await JSZip.loadAsync(buf)
    const html = await zip.file('index.html').async('string')
    expect(html).toContain('createParticles')
    expect(html).toContain('#/works')
    expect(html).toContain('@media (max-width: 640px)')
    expect(html).toContain('v-nav-bottom')
  })

  it('AC-18.3 相对 base：无绝对路径资源引用', async () => {
    const buf = await buildSiteZip(v2MultiSite(), 'uint8array')
    const zip = await JSZip.loadAsync(buf)
    const html = await zip.file('index.html').async('string')
    expect(html).not.toMatch(/(src|href)="\/(?!\/)/)
  })

  it('AC-18.4 离线浏览：数据内联于 HTML，运行时不发起 fetch', async () => {
    const buf = await buildSiteZip(v2MultiSite(), 'uint8array')
    const zip = await JSZip.loadAsync(buf)
    const html = await zip.file('index.html').async('string')
    expect(html).toContain('id="site-data"')
    // 运行时脚本段不得 fetch 本地数据文件
    expect(html).not.toContain('fetch(')
  })
})
