import { describe, it, expect, beforeEach } from 'vitest'
import {
  STORAGE_KEY,
  V1_BACKUP_KEY,
  DATA_VERSION,
  serialize,
  deserialize,
  save,
  load,
  exportJson,
  importJson,
  toEmbedUrl
} from '../src/core/storage.js'
import { createElement } from '../src/core/schema.js'

// 覆盖验收标准：AC-6.1 ~ AC-6.4、AC-8.1、AC-12.3、AC-13.1（v2 数据契约 / 双态独立持久化）

beforeEach(() => {
  localStorage.clear()
})

function page(key, elements = [], pageHeight = 100) {
  return { key, name: { zh: key, en: key }, pageHeight, elements }
}

function baseV2(over = {}) {
  const pages = [
    page('home', [createElement('text', { content: { zh: '你好', en: 'Hi' } })], 200),
    page('works'),
    page('projects'),
    page('about'),
  ]
  return {
    locale: 'zh',
    motion: { level: 'standard' },
    published: { theme: 'glass', pages: JSON.parse(JSON.stringify(pages)) },
    draft: { theme: 'glass', pages },
    snapshots: [],
    ...over,
  }
}

describe('AC-6.1 数据契约 v2', () => {
  it('序列化为含 version=2 与 locale/motion/published/draft/snapshots 的单一 JSON 对象', () => {
    const data = serialize(baseV2())
    expect(data).toHaveProperty('version', DATA_VERSION)
    expect(DATA_VERSION).toBe(2)
    for (const k of ['locale', 'motion', 'published', 'draft', 'snapshots']) {
      expect(data, `缺少根字段：${k}`).toHaveProperty(k)
    }
    expect(data.published.pages).toHaveLength(4)
    expect(data.published.pages[0].elements[0].props.content).toEqual({ zh: '你好', en: 'Hi' })
  })

  it('draft/published 经规范化：非法主题回退、页面补全四页、pageHeight 钳制', () => {
    const data = serialize(baseV2({
      published: { theme: 'not-a-theme', pages: [{ key: 'home', pageHeight: 600 }] },
    }))
    expect(data.published.theme).toBe('business')
    expect(data.published.pages).toHaveLength(4)
    expect(data.published.pages[0].pageHeight).toBe(500)
  })

  it('非法快照列表与动效档位回退默认值', () => {
    const data = serialize(baseV2({ snapshots: 'oops', motion: { level: 'turbo' } }))
    expect(data.snapshots).toEqual([])
    expect(data.motion).toEqual({ level: 'standard' })
  })

  it('locale 非法回退中文', () => {
    expect(serialize(baseV2({ locale: 'fr' })).locale).toBe('zh')
  })

  it('AC-13.1 draft 与 published 独立规范化（编辑 draft 不污染 published）', () => {
    const s = baseV2()
    // 模拟编辑草稿：给 draft 加元素，published 保持原样
    s.draft.pages[0].elements.push(createElement('text', { content: '新文本' }))
    const data = serialize(s)
    expect(data.draft.pages[0].elements).toHaveLength(2)
    expect(data.published.pages[0].elements).toHaveLength(1)
    expect(data.published.pages[0].elements[0].props.content).toEqual({ zh: '你好', en: 'Hi' })
  })

  it('AC-13.1 快照列表规范化（过滤无 id 项、补全 data）', () => {
    const s = baseV2({ snapshots: [{ id: 's1', time: 1, note: 'a', data: { theme: 'glass', pages: [] } }, null, { id: 'x' }] })
    const data = serialize(s)
    expect(data.snapshots).toHaveLength(2)
    expect(data.snapshots[0].id).toBe('s1')
    expect(data.snapshots[1].id).toBe('x')
    expect(data.snapshots[1].data).toBeDefined()
  })
})

describe('AC-6.2 localStorage 持久化（v2）', () => {
  it('save 写入指定键名，load 完整恢复（页结构 + 双语字段）', () => {
    save(baseV2())
    const restored = load()
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
    expect(restored.version).toBe(2)
    expect(restored.locale).toBe('zh')
    expect(restored.published.theme).toBe('glass')
    expect(restored.draft.pages[0].elements[0].props.content).toEqual({ zh: '你好', en: 'Hi' })
    expect(restored.published.pages).toHaveLength(4)
  })

  it('无数据时 load 返回 null', () => {
    expect(load()).toBeNull()
  })
})

describe('AC-6.3 JSON 导入导出（v2）', () => {
  it('exportJson 产出可被 importJson 还原的完整数据（含素材 dataURL）', () => {
    const dataURL = 'data:image/png;base64,iVBORw0KGgo='
    const s = baseV2()
    s.draft.pages[0].elements.push(createElement('image', { src: dataURL }))
    const restored = importJson(exportJson(s))
    const els = restored.draft.pages[0].elements
    expect(els[1].props.src).toBe(dataURL)
    expect(restored.published.theme).toBe('glass')
  })
})

describe('AC-6.4 非法数据防护与 v1 自动迁移', () => {
  it('非法 JSON 导入时抛出中文错误', () => {
    expect(() => importJson('{broken json')).toThrow(/数据格式/)
  })

  it('缺失 version 字段导入失败', () => {
    expect(() => importJson(JSON.stringify({ elements: [] }))).toThrow(/版本/)
  })

  it('导入失败不破坏现有 localStorage 数据', () => {
    save(baseV2())
    const before = localStorage.getItem(STORAGE_KEY)
    expect(() => importJson('{broken')).toThrow()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before)
  })

  it('v1 数据 deserialize 自动迁移为 v2，并把原始数据备份到独立键', () => {
    const v1 = {
      version: 1, theme: 'glass', pageHeight: 400,
      sections: [{ name: '首页', y: 0 }, { name: '作品', y: 25 }, { name: '案例', y: 50 }, { name: '项目', y: 75 }],
      elements: [{ id: 'a', type: 'text', x: 0, y: 5, w: 50, h: 4, z: 1, props: { content: '标题' } }],
    }
    const raw = JSON.stringify(v1)
    const v2 = deserialize(raw)
    expect(v2.version).toBe(2)
    expect(v2.draft.pages[0].elements[0].props.content).toEqual({ zh: '标题', en: '' })
    expect(v2.published).toEqual(v2.draft)
    expect(JSON.parse(localStorage.getItem(V1_BACKUP_KEY))).toEqual(v1)
  })

  it('localStorage 中的 v1 旧数据经 load() 自动迁移', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, theme: 'business', elements: [] }))
    const restored = load()
    expect(restored.version).toBe(2)
    expect(restored.draft.pages[0].elements).toEqual([])
  })

  it('未知的高版本号仍报中文版本错误', () => {
    expect(() => importJson(JSON.stringify({ version: 99 }))).toThrow(/版本/)
  })
})

describe('AC-8.1 视频外链解析为嵌入地址', () => {
  it('B站普通视频链接 → 播放器嵌入地址', () => {
    expect(toEmbedUrl('https://www.bilibili.com/video/BV1xx411c7mD'))
      .toBe('https://player.bilibili.com/player.html?bvid=BV1xx411c7mD')
  })

  it('B站带参数链接仍可解析', () => {
    expect(toEmbedUrl('https://www.bilibili.com/video/BV1xx411c7mD?spm_id_from=333'))
      .toBe('https://player.bilibili.com/player.html?bvid=BV1xx411c7mD')
  })

  it('YouTube watch 链接 → embed 地址', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('YouTube 短链接 → embed 地址', () => {
    expect(toEmbedUrl('https://youtu.be/dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('已是嵌入地址时原样返回', () => {
    expect(toEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('无法识别的平台抛出中文错误', () => {
    expect(() => toEmbedUrl('https://example.com/watch?v=1')).toThrow(/不支持的视频平台/)
  })
})
