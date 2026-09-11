/**
 * v1 → v2 数据迁移（AC-6.4）
 * v1：单画布四分区（pageHeight / sections / elements）
 * v2：四页模型（draft / published 各含 pages）+ 双语字段
 */
import { toBi } from './i18n.js'
import { isThemeId } from './theme.js'
import { PAGE_KEYS, normalizePages } from './pages.js'

/** 分区名称到页面 key 的映射（v1 分区顺序固定对应四页） */
function sectionPageKey(index) {
  return PAGE_KEYS[Math.min(index, PAGE_KEYS.length - 1)]
}

/** 双语化文本元素的可双语字段 */
function biElement(el) {
  if (el.type === 'text') {
    return { ...el, props: { ...el.props, content: toBi(el.props?.content) } }
  }
  if (el.type === 'link') {
    return { ...el, props: { ...el.props, title: toBi(el.props?.title) } }
  }
  if (el.type === 'gallery') {
    return {
      ...el,
      props: {
        ...el.props,
        images: (el.props?.images ?? []).map((im) => ({ ...im, caption: toBi(im.caption) })),
      },
    }
  }
  return el
}

/**
 * v1 站点数据迁移为 v2 契约：
 * - 有 sections：元素按分区区间归入对应页，y/h 换算为页内百分比，每页页高 100
 * - 无 sections：全部归入首页，坐标与画布高度原样保留
 * - 文本字段归一化双语；主题沿用（非法回退 business）；draft 与 published 一致
 */
export function migrateV1toV2(v1) {
  const theme = isThemeId(v1?.theme) ? v1.theme : 'business'
  const elements = Array.isArray(v1?.elements) ? v1.elements : []
  const pages = {}

  const sections = (Array.isArray(v1?.sections) ? v1.sections : [])
    .filter((s) => s && typeof s.y === 'number')
    .sort((a, b) => a.y - b.y)

  if (sections.length === 0) {
    // 无分区：整体作为首页，坐标原样
    pages.home = { key: 'home', pageHeight: Number(v1?.pageHeight) || 100, elements: elements.map(biElement) }
  } else {
    sections.forEach((s, i) => {
      const nextY = i + 1 < sections.length ? sections[i + 1].y : 100
      const span = Math.max(nextY - s.y, 0.0001)
      const inRange = elements.filter((e) => e.y >= s.y && (e.y < nextY || (i === sections.length - 1 && e.y <= 100)))
      pages[sectionPageKey(i)] = {
        key: sectionPageKey(i),
        pageHeight: 100,
        elements: inRange.map((e) =>
          biElement({ ...e, y: ((e.y - s.y) / span) * 100, h: (e.h / span) * 100 }),
        ),
      }
    })
  }

  const draft = { theme, pages: normalizePages(Object.values(pages)) }
  return {
    version: 2,
    locale: 'zh',
    motion: { level: 'standard' },
    draft,
    published: JSON.parse(JSON.stringify(draft)),
    snapshots: [],
  }
}
