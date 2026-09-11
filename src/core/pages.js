/**
 * 多页页面模型（AC-10.1 / AC-10.2）：固定四页 + 规范化 + 多页合成单画布视图
 * 纯逻辑，无 DOM / Vue 依赖
 */
import { toBi, pickText } from './i18n.js'
import { isThemeId } from './theme.js'

/** 页面 key 固定四页 */
export const PAGE_KEYS = ['home', 'works', 'projects', 'about']

/** 默认页名（双语） */
export const DEFAULT_PAGE_NAMES = {
  home: { zh: '首页', en: 'Home' },
  works: { zh: '作品集', en: 'Works' },
  projects: { zh: '项目', en: 'Projects' },
  about: { zh: '关于我', en: 'About' },
}

/** 页高钳制范围（vh） */
const clampHeight = (v) => Math.min(500, Math.max(100, Math.round(Number(v) || 100)))

/** 规范化单页：字段补全、名称双语化、页高钳制 */
function normalizePage(raw, key) {
  const name = raw && typeof raw === 'object' ? raw.name : undefined
  const elements = raw && Array.isArray(raw.elements) ? raw.elements : []
  return {
    key,
    name: toBi(name ?? DEFAULT_PAGE_NAMES[key]),
    pageHeight: clampHeight(raw?.pageHeight),
    elements,
  }
}

/**
 * 规范化页面列表（AC-10.2）：
 * 缺省补全四页（按 PAGE_KEYS 顺序）、过滤未知 key
 */
export function normalizePages(pages) {
  const list = Array.isArray(pages) ? pages : []
  return PAGE_KEYS.map((key) => normalizePage(list.find((p) => p && p.key === key), key))
}

/** 按 key 查找页面，未命中返回 null */
export function pageAt(pages, key) {
  const list = Array.isArray(pages) ? pages : []
  return list.find((p) => p.key === key) ?? null
}

/**
 * 多页合成单画布视图（AC-10.2，导出适配）：
 * - pageHeight = 各页页高之和
 * - sections 为各页起始百分比位置，页名取当前语言
 * - 元素 y/h 从页内百分比换算为整画布百分比，x/w/z 等保持不变
 * @param {{theme?: string, pages?: Array}} state 页面状态（draft 或 published）
 * @param {string} locale 取页名语言，默认中文
 */
export function flattenPages(state, locale = 'zh') {
  const pages = normalizePages(state?.pages)
  const total = pages.reduce((sum, p) => sum + p.pageHeight, 0)
  const sections = []
  const elements = []
  let acc = 0 // 已累计页高（vh）
  for (const p of pages) {
    const ratio = p.pageHeight / total
    sections.push({ key: p.key, name: pickText(p.name, locale), y: (acc / total) * 100 })
    for (const el of p.elements) {
      elements.push({ ...el, y: (acc / total) * 100 + el.y * ratio, h: el.h * ratio })
    }
    acc += p.pageHeight
  }
  return {
    pageHeight: total,
    sections,
    elements,
    theme: isThemeId(state?.theme) ? state.theme : 'business',
  }
}
