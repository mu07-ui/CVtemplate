/**
 * 双语内容工具（AC-12）：中英双语字段归一化、取值回退、深层解析
 * 纯逻辑，无 DOM / Vue 依赖
 */

/** 支持的语言列表 */
export const LANGS = ['zh', 'en']

/** 空双语结构 */
const EMPTY = Object.freeze({ zh: '', en: '' })

/**
 * 归一化为双语结构（AC-12.1）：
 * - 字符串 → { zh: 值, en: '' }
 * - 对象 → 补全缺失语言字段
 * - 空值 / 非字符串输入 → 全空双语
 */
export function toBi(value) {
  if (typeof value === 'string') return { zh: value, en: '' }
  if (value && typeof value === 'object') {
    return {
      zh: typeof value.zh === 'string' ? value.zh : '',
      en: typeof value.en === 'string' ? value.en : '',
    }
  }
  return { ...EMPTY }
}

/**
 * 按语言取值并回退（AC-12.1）：
 * - 英文缺失回退中文，中文缺失回退英文
 * - 纯字符串输入两种语言同文
 * - 非法语言代码按中文处理
 */
export function pickText(value, lang = 'zh') {
  const l = LANGS.includes(lang) ? lang : 'zh'
  const other = l === 'zh' ? 'en' : 'zh'
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return ''
  return value[l] || value[other] || ''
}

/** 判断对象是否为双语结构（含 zh / en 字符串字段） */
function isBi(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (typeof value.zh === 'string' || typeof value.en === 'string') &&
    Object.keys(value).every((k) => LANGS.includes(k))
  )
}

/**
 * 深层双语解析（AC-12.1，导出渲染用）：
 * 递归遍历数据树，把其中的双语对象解析为当前语言字符串
 */
export function resolveBiDeep(tree, lang = 'zh') {
  if (Array.isArray(tree)) return tree.map((v) => resolveBiDeep(v, lang))
  if (isBi(tree)) return pickText(tree, lang)
  if (tree && typeof tree === 'object') {
    const out = {}
    for (const k of Object.keys(tree)) out[k] = resolveBiDeep(tree[k], lang)
    return out
  }
  return tree
}
