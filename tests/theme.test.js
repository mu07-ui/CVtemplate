import { describe, it, expect } from 'vitest'
import { THEMES, THEME_IDS, isThemeId, applyTheme } from '../src/core/theme.js'

// 覆盖验收标准：AC-4.1 ~ AC-4.4

const REQUIRED_VARS = ['background', 'foreground', 'primary', 'accent', 'radius', 'shadow', 'font', 'backdrop', 'backdropSize']

describe('AC-4.1 三套内置主题', () => {
  it('包含 business / glass / pixel 三套主题', () => {
    expect(THEME_IDS).toEqual(expect.arrayContaining(['business', 'glass', 'pixel']))
    expect(THEME_IDS).toHaveLength(3)
  })
})

describe('AC-4.2 主题变量完整性', () => {
  it('每套主题都提供完整 CSS 变量集，无缺失字段', () => {
    for (const id of THEME_IDS) {
      for (const key of REQUIRED_VARS) {
        expect(THEMES[id], `主题 ${id} 缺少变量 ${key}`).toHaveProperty(key)
        expect(THEMES[id][key]).toBeTruthy()
      }
    }
  })

  it('三套主题的视觉变量互不相同（风格确实有区分）', () => {
    const values = THEME_IDS.map(id => THEMES[id].background)
    expect(new Set(values).size).toBe(3)
  })

  it('氛围背景 backdrop 为多层渐变（官网级光效）', () => {
    for (const id of THEME_IDS) {
      expect(THEMES[id].backdrop).toContain('gradient')
      expect(THEMES[id].backdropSize).toBeTruthy()
    }
  })
})

describe('AC-4.3 主题切换', () => {
  it('isThemeId 校验合法 / 非法主题 id', () => {
    expect(isThemeId('business')).toBe(true)
    expect(isThemeId('not-a-theme')).toBe(false)
  })

  it('applyTheme 将 CSS 变量写入 document 根节点', () => {
    applyTheme('business')
    const root = document.documentElement
    expect(root.style.getPropertyValue('--bg')).toBe(THEMES.business.background)
    applyTheme('glass')
    expect(root.style.getPropertyValue('--bg')).toBe(THEMES.glass.background)
  })
})

describe('AC-4.4 主题持久化', () => {
  it('主题 id 可被序列化 / 反序列化（作为站点数据一部分）', async () => {
    const { serialize, deserialize } = await import('../src/core/storage.js')
    const data = serialize({ elements: [], theme: 'pixel' })
    expect(data.theme).toBe('pixel')
    const restored = deserialize(JSON.stringify(data))
    expect(restored.theme).toBe('pixel')
  })
})
