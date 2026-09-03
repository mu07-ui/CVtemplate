/**
 * 数据持久化与导入导出
 * 覆盖验收标准：AC-6.1 ~ AC-6.4, AC-8.1
 */

/** localStorage 存储键名（AC-6.2） */
export const STORAGE_KEY = 'portfolio-site-data'

/** 当前数据版本（AC-6.1） */
export const DATA_VERSION = 1

/** 序列化站点数据：单一 JSON 对象，含 version / elements / theme / pageHeight / sections（AC-6.1、AC-9.1） */
export function serialize(site) {
  const ph = Math.round(Number(site?.pageHeight) || 100)
  return {
    version: DATA_VERSION,
    elements: site?.elements ?? [],
    theme: site?.theme ?? 'business',
    pageHeight: Math.min(500, Math.max(100, ph)),
    sections: Array.isArray(site?.sections) ? site.sections : [],
  }
}

/** 反序列化并校验（AC-6.4）：非法输入抛中文错误，不产生副作用 */
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
  if (data.version !== DATA_VERSION) {
    throw new Error(`数据版本不兼容：${data.version}`)
  }
  return {
    version: data.version,
    elements: Array.isArray(data.elements) ? data.elements : [],
    theme: data.theme ?? 'business',
    pageHeight: Number(data.pageHeight) || 100,
    sections: Array.isArray(data.sections) ? data.sections : [],
  }
}

/** 保存到 localStorage（AC-6.2） */
export function save(site) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(site)))
}

/** 从 localStorage 读取（AC-6.2），无数据或损坏时返回 null */
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
