/**
 * 画布坐标与图层工具
 * 覆盖验收标准：AC-2.1 ~ AC-2.5, AC-2.7
 */

/** 像素 → 百分比（AC-2.2） */
export const pxToPercent = (px, base) => (px / base) * 100

/** 百分比 → 像素（AC-2.2） */
export const percentToPx = (pct, base) => (pct / 100) * base

/** 网格吸附（AC-2.4 / AC-2.5）：取最近的网格线，恰好落线时不变 */
export const snapToGrid = (value, grid = 8) => Math.round(value / grid) * grid

/**
 * 图层调整（AC-2.7）
 * @param {'up'|'down'|'top'|'bottom'} action
 * @returns {Array} 新数组（不修改原数组），层级 z 按顺序重排
 */
export function moveLayer(list, id, action) {
  const arr = [...list]
  const i = arr.findIndex((e) => e.id === id)
  if (i === -1) return arr
  let j = i
  if (action === 'up') j = Math.min(i + 1, arr.length - 1)
  else if (action === 'down') j = Math.max(i - 1, 0)
  else if (action === 'top') j = arr.length - 1
  else if (action === 'bottom') j = 0
  if (i === j) return arr
  const [el] = arr.splice(i, 1)
  arr.splice(j, 0, el)
  return arr.map((e, idx) => ({ ...e, z: idx }))
}
