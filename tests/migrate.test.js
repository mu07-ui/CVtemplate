import { describe, it, expect } from 'vitest'
import { migrateV1toV2 } from '../src/core/migrate.js'

// 覆盖验收标准：AC-6.4（v1 → v2 数据迁移）

const v1 = {
  version: 1,
  theme: 'glass',
  pageHeight: 400,
  sections: [
    { name: '首页', y: 0 },
    { name: '作品', y: 25 },
    { name: '案例', y: 50 },
    { name: '项目', y: 75 },
  ],
  elements: [
    { id: 'a', type: 'text', x: 8, y: 5.5, w: 80, h: 4, z: 2, props: { content: '以热爱' } },
    { id: 'b', type: 'text', x: 10, y: 26.5, w: 40, h: 3, z: 2, props: { content: '精选作品' } },
    { id: 'c', type: 'link', x: 8, y: 48, w: 26, h: 3.5, z: 2, props: { title: 'Behance', url: 'https://example.com' } },
    { id: 'd', type: 'gallery', x: 8, y: 82, w: 40, h: 6.5, z: 2, props: { images: [{ src: 'x.png', caption: '星图' }] } },
  ],
}

describe('AC-6.4 v1→v2 迁移：分区切页与坐标换算', () => {
  it('元素按分区归入对应页，y/h 换算为页内百分比', () => {
    const v2 = migrateV1toV2(v1)
    const [home, works, projects, about] = v2.draft.pages
    expect(home.elements.map((e) => e.id)).toEqual(['a'])
    expect(home.elements[0].y).toBeCloseTo(22) // 5.5 * 4
    expect(home.elements[0].h).toBeCloseTo(16) // 4 * 4
    expect(works.elements.map((e) => e.id)).toEqual(['b', 'c'])
    expect(works.elements[0].y).toBeCloseTo(6) // (26.5 - 25) * 4
    expect(works.elements[0].h).toBeCloseTo(12) // 3 * 4
    expect(projects.elements).toEqual([])
    expect(about.elements.map((e) => e.id)).toEqual(['d'])
    expect(about.elements[0].y).toBeCloseTo(28) // (82 - 75) * 4
    expect(v2.draft.pages.every((p) => p.pageHeight === 100)).toBe(true)
  })

  it('x/w 保持不变', () => {
    const b = migrateV1toV2(v1).draft.pages[1].elements[0]
    expect(b.x).toBe(10)
    expect(b.w).toBe(40)
  })

  it('无 sections 时全部归入首页，坐标与画布高度原样保留', () => {
    const v2 = migrateV1toV2({ ...v1, sections: [] })
    expect(v2.draft.pages[0].elements).toHaveLength(4)
    expect(v2.draft.pages[0].elements[0].y).toBe(5.5)
    expect(v2.draft.pages[0].pageHeight).toBe(400)
  })

  it('分区少于四个时缺省页为空，元素按区间归页', () => {
    const two = migrateV1toV2({ ...v1, sections: [{ name: '首页', y: 0 }, { name: '作品', y: 50 }] })
    expect(two.draft.pages[0].elements.map((e) => e.id)).toEqual(['a', 'b', 'c'])
    expect(two.draft.pages[1].elements.map((e) => e.id)).toEqual(['d'])
    expect(two.draft.pages[2].elements).toEqual([])
    expect(two.draft.pages[3].elements).toEqual([])
  })
})

describe('AC-6.4 v1→v2 迁移：文本双语化与主题', () => {
  it('text.content / link.title / gallery.caption 归一化为 {zh,en}', () => {
    const v2 = migrateV1toV2(v1)
    expect(v2.draft.pages[1].elements[0].props.content).toEqual({ zh: '精选作品', en: '' })
    expect(v2.draft.pages[1].elements[1].props.title).toEqual({ zh: 'Behance', en: '' })
    expect(v2.draft.pages[3].elements[0].props.images[0].caption).toEqual({ zh: '星图', en: '' })
  })

  it('已是双语的字段原样保留', () => {
    const v2 = migrateV1toV2({
      ...v1,
      elements: [{ id: 'a', type: 'text', x: 0, y: 1, w: 2, h: 2, z: 0, props: { content: { zh: '你', en: 'Hi' } } }],
    })
    expect(v2.draft.pages[0].elements[0].props.content).toEqual({ zh: '你', en: 'Hi' })
  })

  it('主题沿用（五主题更名属 P2），非法主题回退 business', () => {
    expect(migrateV1toV2(v1).draft.theme).toBe('glass')
    expect(migrateV1toV2({ ...v1, theme: 'nope' }).draft.theme).toBe('business')
  })

  it('迁移结果 draft 与 published 一致，locale=zh，动效默认标准档，快照为空', () => {
    const v2 = migrateV1toV2(v1)
    expect(v2.draft).toEqual(v2.published)
    expect(v2.locale).toBe('zh')
    expect(v2.motion).toEqual({ level: 'standard' })
    expect(v2.snapshots).toEqual([])
  })
})
