import { describe, it, expect } from 'vitest'
import { pxToPercent, percentToPx, snapToGrid, moveLayer } from '../src/core/canvas.js'

// 覆盖验收标准：AC-2.1 ~ AC-2.5, AC-2.7

describe('AC-2.2 像素与百分比互转', () => {
  it('pxToPercent：基于基准尺寸换算', () => {
    expect(pxToPercent(360, 1440)).toBeCloseTo(25, 2)
    expect(pxToPercent(0, 1440)).toBe(0)
    expect(pxToPercent(1440, 1440)).toBeCloseTo(100, 2)
  })

  it('percentToPx：百分比还原为像素', () => {
    expect(percentToPx(25, 1440)).toBeCloseTo(360, 1)
    expect(percentToPx(100, 1440)).toBeCloseTo(1440, 1)
  })

  it('往返转换误差 ≤ 0.01%', () => {
    const px = 317
    const back = percentToPx(pxToPercent(px, 1440), 1440)
    expect(Math.abs(back - px)).toBeLessThanOrEqual(0.0001 * 1440)
  })
})

describe('AC-2.4 / AC-2.5 网格吸附', () => {
  it('吸附到最近的网格线（默认网格 8）', () => {
    expect(snapToGrid(11)).toBe(8)
    expect(snapToGrid(14)).toBe(16)
    expect(snapToGrid(20)).toBe(24)
  })

  it('自定义网格尺寸', () => {
    expect(snapToGrid(13, 10)).toBe(10)
    expect(snapToGrid(16, 10)).toBe(20)
  })

  it('恰好落在网格线上时不变', () => {
    expect(snapToGrid(24)).toBe(24)
  })
})

describe('AC-2.7 图层调整', () => {
  const list = [
    { id: 'a', z: 0 },
    { id: 'b', z: 1 },
    { id: 'c', z: 2 }
  ]

  it('up：元素层级 +1（与上层交换）', () => {
    const next = moveLayer(list, 'b', 'up')
    expect(next.findIndex(e => e.id === 'b')).toBe(2)
  })

  it('down：元素层级 -1（与下层交换）', () => {
    const next = moveLayer(list, 'b', 'down')
    expect(next.findIndex(e => e.id === 'b')).toBe(0)
  })

  it('top：元素移到最顶层', () => {
    const next = moveLayer(list, 'a', 'top')
    expect(next.findIndex(e => e.id === 'a')).toBe(2)
  })

  it('bottom：元素移到最底层', () => {
    const next = moveLayer(list, 'c', 'bottom')
    expect(next.findIndex(e => e.id === 'c')).toBe(0)
  })

  it('顶层再 up / 底层再 down 不越界、不报错', () => {
    expect(() => moveLayer(list, 'c', 'up')).not.toThrow()
    expect(() => moveLayer(list, 'a', 'down')).not.toThrow()
  })
})
