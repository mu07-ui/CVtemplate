import { describe, it, expect } from 'vitest'
import {
  ELEMENT_TYPES,
  createElement,
  createText,
  createImage,
  createVideo,
  createLink,
  createSkillTag,
  createGallery,
  createDecoration,
  createTimeline,
  createSkillMatrix,
  createHonors,
  createContactCard,
  validateElement
} from '../src/core/schema.js'

// 覆盖验收标准：AC-3.1 ~ AC-3.9、AC-16.1

describe('AC-3.1 元素工厂基础', () => {
  it('每种类型都能创建元素，包含 id / type / 位置(%) / 尺寸(%) / 层级', () => {
    for (const type of ELEMENT_TYPES) {
      const el = createElement(type)
      expect(el.id).toBeTruthy()
      expect(el.type).toBe(type)
      expect(el).toHaveProperty('x')
      expect(el).toHaveProperty('y')
      expect(el).toHaveProperty('w')
      expect(el).toHaveProperty('h')
      expect(el).toHaveProperty('z')
    }
  })

  it('两个元素的 id 不重复', () => {
    const a = createElement('text')
    const b = createElement('text')
    expect(a.id).not.toBe(b.id)
  })

  it('位置与尺寸默认为 0~100 之间的百分比数值', () => {
    const el = createElement('image')
    for (const key of ['x', 'y', 'w', 'h']) {
      expect(el[key]).toBeGreaterThanOrEqual(0)
      expect(el[key]).toBeLessThanOrEqual(100)
    }
  })

  it('非法类型创建时抛出中文错误', () => {
    expect(() => createElement('unknown')).toThrow(/不支持的元素类型/)
  })
})

describe('AC-3.2 文本元素', () => {
  it('支持内容、字号、颜色', () => {
    const el = createText({ content: '你好世界', fontSize: 24, color: '#333333' })
    expect(el.props.content).toBe('你好世界')
    expect(el.props.fontSize).toBe(24)
    expect(el.props.color).toBe('#333333')
  })
})

describe('AC-3.3 图片元素', () => {
  it('本地上传以 dataURL 存储', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo='
    const el = createImage({ src: dataUrl })
    expect(el.props.src).toBe(dataUrl)
  })

  it('URL 来源直接存储', () => {
    const url = 'https://example.com/a.png'
    const el = createImage({ src: url })
    expect(el.props.src).toBe(url)
  })
})

describe('AC-3.4 视频元素', () => {
  it('来源为 link 或 upload 二选一', () => {
    const a = createVideo({ source: 'link', url: 'https://www.bilibili.com/video/BV1xx411c7mD' })
    const b = createVideo({ source: 'upload', src: 'data:video/mp4;base64,AAAA' })
    expect(a.props.source).toBe('link')
    expect(b.props.source).toBe('upload')
  })
})

describe('AC-3.5 链接卡片元素', () => {
  it('含标题与 URL', () => {
    const el = createLink({ title: '我的 GitHub', url: 'https://github.com/me' })
    expect(el.props.title).toBe('我的 GitHub')
    expect(el.props.url).toBe('https://github.com/me')
  })
})

describe('AC-3.6 技能标签元素', () => {
  it('支持标签列表的增删改', () => {
    const el = createSkillTag({ tags: ['Vue', 'Vite'] })
    expect(el.props.tags).toEqual(['Vue', 'Vite'])
  })
})

describe('AC-3.7 相册元素', () => {
  it('支持多图列表', () => {
    const el = createGallery({
      images: [
        { src: 'data:image/png;base64,AAA', caption: '作品一' },
        { src: 'data:image/png;base64,BBB', caption: '作品二' }
      ]
    })
    expect(el.props.images).toHaveLength(2)
  })
})

describe('AC-3.8 装饰元素', () => {
  it('至少支持 色块/线条/图标 三种，可设透明度', () => {
    const block = createDecoration({ shape: 'block', opacity: 0.5 })
    const line = createDecoration({ shape: 'line' })
    const icon = createDecoration({ shape: 'icon' })
    expect(block.props.shape).toBe('block')
    expect(block.props.opacity).toBe(0.5)
    expect(line.props.shape).toBe('line')
    expect(icon.props.shape).toBe('icon')
  })
})

describe('AC-3.9 元素校验', () => {
  it('合法元素通过校验', () => {
    const el = createText({ content: 'ok' })
    const result = validateElement(el)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('未知类型校验失败', () => {
    const result = validateElement({ id: '1', type: 'foo', x: 10, y: 10, w: 10, h: 10, z: 0 })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('坐标越界（<0 或 >100）校验失败', () => {
    const neg = validateElement({ id: '1', type: 'text', x: -5, y: 10, w: 10, h: 10, z: 0 })
    const over = validateElement({ id: '2', type: 'text', x: 101, y: 10, w: 10, h: 10, z: 0 })
    expect(neg.valid).toBe(false)
    expect(over.valid).toBe(false)
  })

  it('非法 URL 校验失败', () => {
    const el = createLink({ title: '坏链接', url: 'not a url' })
    const result = validateElement(el)
    expect(result.valid).toBe(false)
  })
})

describe('AC-16.1 四类结构化元素纳入工厂与校验', () => {
  it('ELEMENT_TYPES 扩展为 11 类（含 timeline/skillMatrix/honors/contactCard）', () => {
    for (const t of ['timeline', 'skillMatrix', 'honors', 'contactCard']) {
      expect(ELEMENT_TYPES).toContain(t)
    }
    expect(ELEMENT_TYPES).toHaveLength(11)
  })

  it('时间线：items 含 date/title/desc', () => {
    const el = createTimeline({
      items: [{ date: '2024', title: { zh: '入职', en: 'Joined' }, desc: { zh: '前端工程师', en: '' } }],
    })
    expect(el.type).toBe('timeline')
    expect(el.props.items).toHaveLength(1)
    expect(el.props.items[0].date).toBe('2024')
    expect(validateElement(el).valid).toBe(true)
  })

  it('技能矩阵：items 含 name/level（0~100）', () => {
    const el = createSkillMatrix({ items: [{ name: 'Vue', level: 90 }, { name: '设计', level: 70 }] })
    expect(el.props.items[0].level).toBe(90)
    expect(validateElement(el).valid).toBe(true)
  })

  it('荣誉证书：items 含 title/issuer/date/link', () => {
    const el = createHonors({
      items: [{ title: { zh: '优秀作品奖', en: 'Award' }, issuer: '组委会', date: '2025', link: 'https://x.com' }],
    })
    expect(el.props.items[0].issuer).toBe('组委会')
    expect(validateElement(el).valid).toBe(true)
  })

  it('联系卡片：items 含 label/value/href（mailto 合法）', () => {
    const el = createContactCard({
      items: [{ label: { zh: '邮箱', en: 'Email' }, value: 'me@x.com', href: 'mailto:me@x.com' }],
    })
    expect(el.props.items[0].href).toBe('mailto:me@x.com')
    expect(validateElement(el).valid).toBe(true)
  })

  it('四类元素含元素级 name/visible/locked 字段（图层面板用）', () => {
    for (const c of [createTimeline(), createSkillMatrix(), createHonors(), createContactCard()]) {
      expect(c).toHaveProperty('name')
      expect(c.visible).toBe(true)
      expect(c.locked).toBe(false)
    }
  })

  it('联系卡片非法 href 校验失败', () => {
    const el = createContactCard({ items: [{ label: 'x', value: 'y', href: 'javascript:alert(1)' }] })
    expect(validateElement(el).valid).toBe(false)
  })
})
