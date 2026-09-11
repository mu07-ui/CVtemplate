import { describe, it, expect } from 'vitest'
import {
  FONT_PRESETS,
  normalizeImageStyle,
  normalizeTextStyle,
  imageFilterCss,
  elementAnimate,
} from '../src/core/beautify.js'
import { createImage, createText } from '../src/core/schema.js'

// 覆盖验收标准：AC-16.2 ~ AC-16.5

describe('AC-16.2 图片美化属性', () => {
  it('normalizeImageStyle 补全 opacity/radius/shadow/grayscale/blur 默认值', () => {
    const s = normalizeImageStyle({})
    expect(s).toMatchObject({ opacity: 1, radius: 0, shadow: '', grayscale: 0, blur: 0 })
  })

  it('透传已有美化值并钳制范围（opacity 0~1，grayscale/blur 0~100）', () => {
    const s = normalizeImageStyle({ opacity: 2, radius: -5, grayscale: 200, blur: -3 })
    expect(s.opacity).toBe(1)
    expect(s.radius).toBe(0)
    expect(s.grayscale).toBe(100)
    expect(s.blur).toBe(0)
  })

  it('imageFilterCss 按灰度/模糊生成 CSS filter；全为 0 时为空串', () => {
    expect(imageFilterCss(normalizeImageStyle({}))).toBe('')
    expect(imageFilterCss(normalizeImageStyle({ grayscale: 50 }))).toBe('grayscale(50%)')
    const css = imageFilterCss(normalizeImageStyle({ grayscale: 50, blur: 4 }))
    expect(css).toContain('grayscale(50%)')
    expect(css).toContain('blur(4px)')
  })

  it('图片元素可携带美化属性并持久化（普通对象序列化）', () => {
    const el = createImage({ src: 'a.png', opacity: 0.7, radius: 12, grayscale: 30 })
    const round = JSON.parse(JSON.stringify(el))
    expect(round.props.opacity).toBe(0.7)
    expect(round.props.radius).toBe(12)
    expect(round.props.grayscale).toBe(30)
  })
})

describe('AC-16.3 文本美化属性', () => {
  it('预设字体库不少于 6 款，每项含 id/label/cssFont', () => {
    expect(FONT_PRESETS.length).toBeGreaterThanOrEqual(6)
    for (const f of FONT_PRESETS) {
      expect(f).toHaveProperty('id')
      expect(f).toHaveProperty('label')
      expect(f).toHaveProperty('cssFont')
    }
    const ids = FONT_PRESETS.map((f) => f.id)
    expect(new Set(ids).size).toBe(FONT_PRESETS.length)
  })

  it('normalizeTextStyle 补全 fontFamily/lineHeight/strokeColor/strokeWidth', () => {
    const s = normalizeTextStyle({})
    expect(s.fontFamily).toBeTruthy()
    expect(typeof s.lineHeight).toBe('number')
    expect(s).toHaveProperty('strokeColor')
    expect(s.strokeWidth).toBe(0)
  })

  it('非法 fontFamily 回退第一款预设', () => {
    const s = normalizeTextStyle({ fontFamily: 'not-exist' })
    expect(s.fontFamily).toBe(FONT_PRESETS[0].id)
  })

  it('文本元素可携带字体/行高/描边并持久化', () => {
    const el = createText({ fontFamily: 'serif', lineHeight: 2, strokeColor: '#000', strokeWidth: 1 })
    const round = JSON.parse(JSON.stringify(el))
    expect(round.props.fontFamily).toBe('serif')
    expect(round.props.lineHeight).toBe(2)
    expect(round.props.strokeColor).toBe('#000')
  })
})

describe('AC-16.4 元素入场动效开关', () => {
  it('elementAnimate 默认 true；显式关闭时为 false', () => {
    expect(elementAnimate(createText())).toBe(true)
    expect(elementAnimate(createText({ animate: false }))).toBe(false)
  })

  it('任意元素类型均支持该开关', () => {
    expect(elementAnimate(createImage({ animate: false }))).toBe(false)
  })
})
