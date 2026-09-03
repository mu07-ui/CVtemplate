import { describe, it, expect } from 'vitest'
import { normalizeSections, sectionIndexAt, clampIndex } from '../src/core/sections.js'

// 覆盖验收标准：AC-9.1 / AC-9.3

describe('AC-9.1 分区数据规范化', () => {
  it('补全默认值并按起始坐标排序', () => {
    const list = normalizeSections([
      { name: '作品', y: 50 },
      { name: '首页', y: 0 },
      { name: '项目' }, // y 缺省
    ])
    expect(list).toEqual([
      { name: '首页', y: 0 },
      { name: '作品', y: 50 },
      { name: '项目', y: 100 },
    ])
  })

  it('坐标钳制到 0~100，非法输入过滤，空数组原样返回', () => {
    const list = normalizeSections([
      { name: 'A', y: -5 },
      { name: '', y: 30 }, // 无名称 → 过滤
      { name: 'B', y: 150 },
      '垃圾数据',
    ])
    expect(list).toEqual([{ name: 'A', y: 0 }, { name: 'B', y: 100 }])
    expect(normalizeSections([])).toEqual([])
    expect(normalizeSections(null)).toEqual([])
  })
})

describe('AC-9.3 滚动进度 → 当前分区', () => {
  const sections = [
    { name: '首页', y: 0 },
    { name: '作品', y: 25 },
    { name: '案例', y: 50 },
    { name: '项目', y: 75 },
  ]

  it('返回进度所在分区（最后一个 y ≤ 进度的分区）', () => {
    expect(sectionIndexAt(0, sections)).toBe(0)
    expect(sectionIndexAt(24.9, sections)).toBe(0)
    expect(sectionIndexAt(25, sections)).toBe(1)
    expect(sectionIndexAt(66, sections)).toBe(2)
    expect(sectionIndexAt(99, sections)).toBe(3)
  })

  it('进度越界时钳制到首尾分区，空分区返回 -1', () => {
    expect(sectionIndexAt(-10, sections)).toBe(0)
    expect(sectionIndexAt(120, sections)).toBe(3)
    expect(sectionIndexAt(50, [])).toBe(-1)
  })
})

describe('AC-9.2 上一页/下一页索引钳制', () => {
  it('在 0 ~ 总数-1 之间移动，不越界', () => {
    expect(clampIndex(2 + 1, 4)).toBe(3)
    expect(clampIndex(3 + 1, 4)).toBe(3)
    expect(clampIndex(2 - 1, 4)).toBe(1)
    expect(clampIndex(0 - 1, 4)).toBe(0)
  })
})
