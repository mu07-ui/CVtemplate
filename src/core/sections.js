/**
 * 分区分页导航（官网式四分区）：纯逻辑，无 DOM 依赖
 * 覆盖验收标准：AC-9.1 ~ AC-9.3
 */

/**
 * 规范化分区列表（AC-9.1）：坐标钳制 0~100、按起始坐标升序、过滤无名/非法项
 * @param {Array<{name?: string, y?: number}>} list
 * @returns {Array<{name: string, y: number}>}
 */
export function normalizeSections(list) {
  if (!Array.isArray(list)) return []
  return list
    .filter((s) => s && typeof s === 'object' && typeof s.name === 'string' && s.name.trim())
    .map((s) => {
      const n = Number(s.y)
      return {
        name: s.name.trim(),
        // y 缺省/非法视为画布末尾；0 是合法起点
        y: Math.min(100, Math.max(0, Math.round(s.y == null || !Number.isFinite(n) ? 100 : n))),
      }
    })
    .sort((a, b) => a.y - b.y)
}

/**
 * 滚动进度 → 当前分区索引（AC-9.3）：取最后一个 y ≤ 进度的分区
 * @param {number} progress 画布纵向滚动进度（百分比 0~100）
 * @param {Array<{name: string, y: number}>} sections 已规范化分区
 * @returns {number} 分区索引；无分区时返回 -1
 */
export function sectionIndexAt(progress, sections) {
  if (!Array.isArray(sections) || sections.length === 0) return -1
  const p = Number(progress) || 0
  let idx = 0
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].y <= p + 0.01) idx = i
  }
  return idx
}

/**
 * 页码索引钳制（AC-9.2 上一页/下一页不越界）
 */
export function clampIndex(i, total) {
  return Math.min(Math.max(i, 0), Math.max(0, total - 1))
}
