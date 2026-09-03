/**
 * 元素数据模型：七类元素工厂 + 校验
 * 覆盖验收标准：AC-3.1 ~ AC-3.9
 */

export const ELEMENT_TYPES = ['text', 'image', 'video', 'link', 'skillTag', 'gallery', 'decoration']

let seq = 0
const genId = () => `el_${Date.now().toString(36)}_${(seq++).toString(36)}`

/**
 * 元素通用工厂（AC-3.1）
 * @param {string} type ELEMENT_TYPES 之一
 * @param {object} overrides 元素属性；其中 x/y/w/h/z 提升到元素层级，其余并入 props
 */
export function createElement(type, overrides = {}) {
  if (!ELEMENT_TYPES.includes(type)) {
    throw new Error(`不支持的元素类型：${type}`)
  }
  const { x, y, w, h, z, ...rest } = overrides
  return {
    id: genId(),
    type,
    x: x ?? 0, y: y ?? 0, w: w ?? 20, h: h ?? 15, // 百分比坐标（AC-2.1）
    z: z ?? 0,
    props: rest,
  }
}

/** 文本元素（AC-3.2）：align 对齐 / weight 字重，用于官网式大标题排版 */
export const createText = (p = {}) =>
  createElement('text', { content: '双击编辑文本', fontSize: 16, color: '#333333', align: 'left', weight: 400, ...p })

/** 图片元素（AC-3.3）：src 为 URL 或 dataURL（支持透明 PNG） */
export const createImage = (p = {}) =>
  createElement('image', { src: '', alt: '', ...p })

/** 视频元素（AC-3.4）：source 为 'link'（外链嵌入）或 'upload'（本地 dataURL） */
export const createVideo = (p = {}) =>
  createElement('video', { source: 'link', url: '', src: '', ...p })

/** 链接卡片元素（AC-3.5） */
export const createLink = (p = {}) =>
  createElement('link', { title: '链接卡片', url: 'https://', ...p })

/** 技能标签元素（AC-3.6）：align 为 'left' | 'center' 时标签组居中排布 */
export const createSkillTag = (p = {}) =>
  createElement('skillTag', { tags: [], align: 'left', ...p })

/** 相册元素（AC-3.7）：images 为 [{ src, caption }] */
export const createGallery = (p = {}) =>
  createElement('gallery', { images: [], ...p })

/** 装饰元素（AC-3.8）：shape 为 'block' | 'line' | 'icon'；blur 为氛围光斑模糊半径(px) */
export const createDecoration = (p = {}) =>
  createElement('decoration', { shape: 'block', color: '#888888', opacity: 1, blur: 0, ...p })

const isValidUrl = (u) => {
  try {
    new URL(u)
    return true
  } catch {
    return false
  }
}

/**
 * 校验元素数据（AC-3.9）
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateElement(el) {
  if (!el || typeof el !== 'object') {
    return { valid: false, errors: ['元素数据无效'] }
  }
  const errors = []
  if (!ELEMENT_TYPES.includes(el.type)) {
    errors.push(`不支持的元素类型：${el.type}`)
  }
  if (!el.id) {
    errors.push('缺少元素 id')
  }
  for (const k of ['x', 'y', 'w', 'h']) {
    const v = el[k]
    if (typeof v !== 'number' || Number.isNaN(v)) {
      errors.push(`坐标 ${k} 必须为数字`)
    } else if (v < 0 || v > 100) {
      errors.push(`坐标 ${k} 超出画布范围（0~100）`)
    }
  }
  if (el.type === 'link' && !isValidUrl(el.props?.url)) {
    errors.push('链接地址无效')
  }
  if (el.type === 'video' && el.props?.source === 'link' && el.props?.url && !isValidUrl(el.props.url)) {
    errors.push('视频链接无效')
  }
  return { valid: errors.length === 0, errors }
}
