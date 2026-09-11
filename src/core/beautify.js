/**
 * 元素美化工具（AC-16.2 ~ AC-16.5）：图片滤镜 / 文本字体预设 / 入场动效开关
 * 纯逻辑，无 DOM / Vue 依赖
 */

/** 预设字体库（AC-16.3，≥6 款） */
export const FONT_PRESETS = [
  { id: 'sans', label: '现代无衬线', cssFont: "'PingFang SC', 'Source Han Sans SC', 'Microsoft YaHei', sans-serif" },
  { id: 'serif', label: '典雅宋体', cssFont: "'Source Han Serif SC', 'Songti SC', 'SimSun', serif" },
  { id: 'mono', label: '等宽极客', cssFont: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace" },
  { id: 'orbitron', label: '科技未来', cssFont: "'Orbitron', 'PingFang SC', sans-serif" },
  { id: 'rounded', label: '圆润可爱', cssFont: "'Nunito', 'PingFang SC', 'Microsoft YaHei', sans-serif" },
  { id: 'pixel', label: '复古像素', cssFont: "'Zpix', 'Press Start 2P', 'Courier New', monospace" },
]

const clamp01 = (v) => Math.min(1, Math.max(0, Number(v) || 0))
const clamp100 = (v) => Math.min(100, Math.max(0, Number(v) || 0))

/**
 * 图片美化属性规范化（AC-16.2）
 * opacity 0~1；radius 0~50(%)；shadow 字符串；grayscale/blur 0~100
 */
export function normalizeImageStyle(p = {}) {
  return {
    opacity: clamp01(p.opacity ?? 1),
    radius: Math.min(50, Math.max(0, Number(p.radius) || 0)),
    shadow: typeof p.shadow === 'string' ? p.shadow : '',
    grayscale: clamp100(p.grayscale),
    blur: clamp100(p.blur),
  }
}

/** 生成 CSS filter 字符串（灰度 + 模糊）；全为 0 时返回空串 */
export function imageFilterCss(style) {
  const s = normalizeImageStyle(style)
  const parts = []
  if (s.grayscale > 0) parts.push(`grayscale(${s.grayscale}%)`)
  if (s.blur > 0) parts.push(`blur(${s.blur}px)`)
  return parts.join(' ')
}

/**
 * 文本美化属性规范化（AC-16.3）
 * fontFamily 必须在预设内；lineHeight 0.8~3；strokeColor 十六进制色；strokeWidth 0~10
 */
export function normalizeTextStyle(p = {}) {
  const fontIds = FONT_PRESETS.map((f) => f.id)
  return {
    fontFamily: fontIds.includes(p.fontFamily) ? p.fontFamily : FONT_PRESETS[0].id,
    lineHeight: Math.min(3, Math.max(0.8, Number(p.lineHeight) || 1.6)),
    strokeColor: typeof p.strokeColor === 'string' ? p.strokeColor : '',
    strokeWidth: Math.min(10, Math.max(0, Number(p.strokeWidth) || 0)),
  }
}

/** 字体 id → CSS font-family 字符串 */
export function fontCss(id) {
  return FONT_PRESETS.find((f) => f.id === id)?.cssFont ?? FONT_PRESETS[0].cssFont
}

/**
 * 元素入场动效开关（AC-16.4）：默认开启，显式 animate:false 关闭
 * 与动效档位联动由渲染层处理（节能档时渲染层整体禁用动画）
 */
export function elementAnimate(el) {
  return el?.props?.animate !== false
}
