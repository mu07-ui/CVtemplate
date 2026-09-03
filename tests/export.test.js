import { describe, it, expect } from 'vitest'
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

// 覆盖验收标准：AC-6.5 / AC-6.6

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

  it('分区数据注入并包含同款分页导航（AC-9.5）', () => {
    const html = buildStandaloneHtml({
      ...sampleSite(),
      pageHeight: 400,
      sections: [
        { name: '首页', y: 0 },
        { name: '作品', y: 25 },
        { name: '案例', y: 50 },
        { name: '项目', y: 75 },
      ],
    })
    expect(html).toContain('sec-nav')
    expect(html).toContain('sec-prev')
    expect(html).toContain('sec-next')
    for (const name of ['首页', '作品', '案例', '项目']) {
      expect(html).toContain(name)
    }
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
    const buf = await buildSiteZip(sampleSite(), 'uint8array')
    const zip = await JSZip.loadAsync(buf)
    expect(Object.keys(zip.files)).toEqual(expect.arrayContaining(['index.html', 'data.json', '部署说明.txt']))

    const html = await zip.file('index.html').async('string')
    expect(html).toContain('<!doctype html>')

    const json = JSON.parse(await zip.file('data.json').async('string'))
    expect(json.version).toBe(1)
    expect(json.elements).toHaveLength(8)
    expect(json.theme).toBe('glass')

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
