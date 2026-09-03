import { describe, it, expect, beforeEach } from 'vitest'
import {
  STORAGE_KEY,
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

// 覆盖验收标准：AC-6.1 ~ AC-6.4, AC-8.1

beforeEach(() => {
  localStorage.clear()
})

describe('AC-6.1 序列化格式', () => {
  it('站点数据序列化为含 version 字段的单一 JSON 对象', () => {
    const data = serialize({ elements: [createElement('text')], theme: 'business' })
    expect(data).toHaveProperty('version', DATA_VERSION)
    expect(data).toHaveProperty('elements')
    expect(data).toHaveProperty('theme')
  })

  it('pageHeight 画布高度：未指定时默认 100，指定时透传（官网式纵向叙事）', () => {
    const def = serialize({ elements: [], theme: 'business' })
    expect(def).toHaveProperty('pageHeight', 100)
    const custom = serialize({ elements: [], theme: 'business', pageHeight: 260 })
    expect(custom).toHaveProperty('pageHeight', 260)
    const restored = deserialize(JSON.stringify(custom))
    expect(restored).toHaveProperty('pageHeight', 260)
  })

  it('sections 分区列表随序列化透传，未指定时默认空数组（AC-9.1）', () => {
    const sections = [{ name: '首页', y: 0 }, { name: '作品', y: 50 }]
    const data = serialize({ elements: [], theme: 'business', sections })
    expect(data).toHaveProperty('sections', sections)
    const restored = deserialize(JSON.stringify(data))
    expect(restored.sections).toEqual(sections)
    expect(serialize({ elements: [], theme: 'business' }).sections).toEqual([])
  })
})

describe('AC-6.2 localStorage 持久化', () => {
  it('save 写入指定键名，load 完整恢复', () => {
    const site = {
      elements: [createElement('text'), createElement('image')],
      theme: 'glass'
    }
    save(site)
    const restored = load()
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
    expect(restored.theme).toBe('glass')
    expect(restored.elements).toHaveLength(2)
  })

  it('无数据时 load 返回 null', () => {
    expect(load()).toBeNull()
  })
})

describe('AC-6.3 JSON 导入导出', () => {
  it('exportJson 产出可被 importJson 还原的完整数据（含素材 dataURL）', () => {
    const dataURL = 'data:image/png;base64,iVBORw0KGgo='
    const site = {
      elements: [createElement('image', { src: dataURL })],
      theme: 'pixel'
    }
    const text = exportJson(site)
    const restored = importJson(text)
    expect(restored.theme).toBe('pixel')
    expect(restored.elements[0].props.src).toBe(dataURL)
  })
})

describe('AC-6.4 非法数据防护', () => {
  it('非法 JSON 导入时抛出中文错误', () => {
    expect(() => importJson('{broken json')).toThrow(/数据格式/)
  })

  it('缺失 version 字段导入失败', () => {
    const noVersion = JSON.stringify({ elements: [], theme: 'glass' })
    expect(() => importJson(noVersion)).toThrow(/版本/)
  })

  it('导入失败不破坏现有 localStorage 数据', () => {
    const site = { elements: [createElement('text')], theme: 'business' }
    save(site)
    const before = localStorage.getItem(STORAGE_KEY)
    expect(() => importJson('{broken')).toThrow()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before)
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
