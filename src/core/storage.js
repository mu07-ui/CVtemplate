/**
 * 数据持久化与导入导出（v2 数据契约）
 * 覆盖验收标准：AC-6.1 ~ AC-6.4, AC-8.1, AC-12.3
 */
import { LANGS } from './i18n.js'
import { isThemeId } from './theme.js'
import { normalizePages } from './pages.js'
import { normalizeSnapshots } from './snapshots.js'
import { migrateV1toV2 } from './migrate.js'

/** localStorage 存储键名（AC-6.2） */
export const STORAGE_KEY = 'portfolio-site-data'

/** v1 旧数据迁移前备份键（AC-6.4） */
export const V1_BACKUP_KEY = 'portfolio-site-data-v1-backup'

/** 当前数据版本（AC-6.1） */
export const DATA_VERSION = 2

/** 动效档位（AC-11）：安静 / 标准 / 丰富 */
export const MOTION_LEVELS = ['quiet', 'standard', 'rich']

/** 规范化页面状态（draft / published）：非法主题回退、页面补全四页、页高钳制 */
function normalizeState(state) {
  return {
    theme: isThemeId(state?.theme) ? state.theme : 'business',
    pages: normalizePages(state?.pages),
  }
}

/** 序列化站点数据：单一 JSON 对象，含 version=2 与 locale/motion/published/draft/snapshots（AC-6.1 / AC-12.3） */
export function serialize(site) {
  return {
    version: DATA_VERSION,
    locale: LANGS.includes(site?.locale) ? site.locale : 'zh',
    motion: {
      level: MOTION_LEVELS.includes(site?.motion?.level) ? site.motion.level : 'standard',
    },
    published: normalizeState(site?.published),
    draft: normalizeState(site?.draft),
    snapshots: normalizeSnapshots(site?.snapshots),
  }
}

/** 反序列化并校验（AC-6.4）：非法输入抛中文错误；v1 数据自动迁移并备份原始数据 */
export function deserialize(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('数据格式错误：无法解析 JSON')
  }
  if (!data || typeof data !== 'object' || data.version === undefined) {
    throw new Error('数据缺少版本字段，无法导入')
  }
  if (data.version === 1) {
    // v1 旧数据：迁移为 v2 并把原始数据备份到独立键，便于手动回滚
    localStorage.setItem(V1_BACKUP_KEY, text)
    return migrateV1toV2(data)
  }
  if (data.version !== DATA_VERSION) {
    throw new Error(`数据版本不兼容：${data.version}`)
  }
  return serialize(data)
}

/** 保存到 localStorage（AC-6.2） */
export function save(site) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(site)))
}

/** 从 localStorage 读取（AC-6.2），无数据或损坏时返回 null；v1 旧数据自动迁移（AC-6.4） */
export function load() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return deserialize(raw)
  } catch {
    return null
  }
}

/** 导出 JSON 字符串（AC-6.3） */
export const exportJson = (site) => JSON.stringify(serialize(site), null, 2)

/** 导入 JSON 字符串（AC-6.3 / AC-6.4） */
export const importJson = (text) => deserialize(text)

/** 视频外链 → 嵌入地址（AC-8.1）：支持 B站 / YouTube，已是嵌入地址时原样返回 */
export function toEmbedUrl(url) {
  if (/^https:\/\/player\.bilibili\.com\//.test(url) || /\/embed\//.test(url)) {
    return url
  }
  let m
  if ((m = url.match(/bilibili\.com\/video\/(BV\w+)/))) {
    return `https://player.bilibili.com/player.html?bvid=${m[1]}`
  }
  if ((m = url.match(/youtube\.com\/watch\?v=([\w-]+)/))) {
    return `https://www.youtube.com/embed/${m[1]}`
  }
  if ((m = url.match(/youtu\.be\/([\w-]+)/))) {
    return `https://www.youtube.com/embed/${m[1]}`
  }
  throw new Error(`不支持的视频平台：${url}`)
}
