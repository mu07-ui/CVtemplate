/**
 * 多选批量工具（AC-17.4）：框选 / Shift 加选 / 批量移动 / 批量对齐
 * 纯逻辑，坐标全部为百分比（0~100）；返回新数组，不修改原数组
 */

const clamp100 = (v) => Math.min(100, Math.max(0, v))

/** 两个矩形是否相交（边界接触也算） */
export function rectsIntersect(a, b) {
  return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y
}

/**
 * 框选（AC-17.4）：返回与框选矩形相交、且 visible 的元素 id
 */
export function boxSelect(elements, box) {
  return elements
    .filter((e) => e.visible !== false && rectsIntersect(e, box))
    .map((e) => e.id)
}

/**
 * Shift 加选/减选（AC-17.4）：已在列表中则移除，否则追加
 */
export function shiftToggle(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

/**
 * 批量移动（AC-17.4）：仅移动 ids 内元素，坐标钳制 0~100
 */
export function moveMany(elements, ids, dx, dy) {
  const set = new Set(ids)
  return elements.map((e) => {
    if (!set.has(e.id)) return e
    const nx = e.x + dx
    const ny = e.y + dy
    return {
      ...e,
      x: clamp100(Math.min(nx, 100 - e.w)),
      y: clamp100(Math.min(ny, 100 - e.h)),
    }
  })
}

/**
 * 批量对齐（AC-17.4）
 * @param {string} type left/right/hcenter/top/bottom/vcenter
 */
export function alignElements(elements, ids, type) {
  const set = new Set(ids)
  const targets = elements.filter((e) => set.has(e.id))
  if (targets.length < 2) return elements.map((e) => ({ ...e }))

  let target
  if (type === 'left') target = Math.min(...targets.map((e) => e.x))
  else if (type === 'right') target = Math.min(...targets.map((e) => e.x + e.w))
  else if (type === 'hcenter') target = Math.min(...targets.map((e) => e.x + e.w / 2))
  else if (type === 'top') target = Math.min(...targets.map((e) => e.y))
  else if (type === 'bottom') target = Math.min(...targets.map((e) => e.y + e.h))
  else if (type === 'vcenter') target = Math.min(...targets.map((e) => e.y + e.h / 2))
  else return elements.map((e) => ({ ...e }))

  return elements.map((e) => {
    if (!set.has(e.id)) return { ...e }
    if (type === 'left') return { ...e, x: target }
    if (type === 'right') return { ...e, x: target - e.w }
    if (type === 'hcenter') return { ...e, x: target - e.w / 2 }
    if (type === 'top') return { ...e, y: target }
    if (type === 'bottom') return { ...e, y: target - e.h }
    return { ...e, y: target - e.h / 2 } // vcenter
  })
}
