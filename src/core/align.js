/**
 * 智能对齐线（AC-17.2）：拖拽时与其他元素边缘/中心及画布中心产生参考线并吸附
 * 纯逻辑，坐标全部为百分比（0~100）
 */

/** 默认吸附阈值（%） */
export const ALIGN_THRESHOLD = 1.5

/** 元素边缘/中心的三个锚点 */
const vAnchors = (r) => [
  { edge: 'left', v: r.x },
  { edge: 'center', v: r.x + r.w / 2 },
  { edge: 'right', v: r.x + r.w },
]
const hAnchors = (r) => [
  { edge: 'top', v: r.y },
  { edge: 'center', v: r.y + r.h / 2 },
  { edge: 'bottom', v: r.y + r.h },
]

/**
 * 查找最近的对齐参考线
 * @param {{x:number,y:number,w:number,h:number}} rect 拖拽中元素矩形
 * @param {Array} others 其他元素矩形数组
 * @param {number} threshold 吸附阈值（%）
 * @returns {{vertical: {at:number, edge:string, delta:number}|null, horizontal: {...}|null}}
 */
export function findAlignGuides(rect, others = [], threshold = ALIGN_THRESHOLD) {
  // 参考点：画布中心 50 + 其他元素的三个锚点
  const refV = [50]
  const refH = [50]
  for (const o of others) {
    if (!o) continue
    refV.push(o.x, o.x + o.w / 2, o.x + o.w)
    refH.push(o.y, o.y + o.h / 2, o.y + o.h)
  }

  const nearest = (anchors, refs) => {
    let best = null
    for (const a of anchors) {
      for (const at of refs) {
        const delta = at - a.v
        const dist = Math.abs(delta)
        if (dist <= threshold && (best === null || dist < best.dist)) {
          best = { at, edge: a.edge, delta, dist }
        }
      }
    }
    if (!best) return null
    return { at: best.at, edge: best.edge, delta: best.delta }
  }

  return {
    vertical: nearest(vAnchors(rect), refV),
    horizontal: nearest(hAnchors(rect), refH),
  }
}

/**
 * 应用参考线：返回吸附后的坐标
 */
export function applyGuides(rect, guides) {
  let { x, y } = rect
  if (guides.vertical) x += guides.vertical.delta
  if (guides.horizontal) y += guides.horizontal.delta
  return { x, y }
}
