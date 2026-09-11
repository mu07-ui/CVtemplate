/**
 * 三端响应式断点（AC-11.1）
 * 混合式策略：内容层用百分比坐标流式等比缩放（天然跨端不变，AC-11.4），
 * 布局层（导航形态等）按断点重排。纯逻辑无 DOM 依赖。
 */

/** 断点（px）：手机 <640 / 平板 640~1023 / PC ≥1024 */
export const BREAKPOINTS = { MOBILE: 640, TABLET: 1024 }

/**
 * 按视口宽度判定设备类型
 * @returns {'mobile'|'tablet'|'pc'}
 */
export function deviceOf(width) {
  const w = Number(width)
  if (!Number.isFinite(w) || w < BREAKPOINTS.MOBILE) return 'mobile'
  if (w < BREAKPOINTS.TABLET) return 'tablet'
  return 'pc'
}

/**
 * 布局适配（AC-11.1 / AC-11.4）：
 * 元素坐标/尺寸全部按百分比 0~100 存储，三端流式等比缩放，
 * 断点切换不改写任何元素数据——返回浅拷贝新数组，坐标原样保留。
 */
export function adaptLayout(elements, _device) {
  return (Array.isArray(elements) ? elements : []).map((e) => ({ ...e }))
}
