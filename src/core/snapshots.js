/**
 * 快照管理（AC-13.2）：发布快照的生成、追加、上限淘汰、规范化
 * 纯逻辑，无 DOM / Vue 依赖
 */
import { normalizePages } from './pages.js'
import { isThemeId } from './theme.js'

/** 快照上限（AC-13.2：超限淘汰最旧，FIFO） */
export const MAX_SNAPSHOTS = 20

/** 生成快照 id（时间戳 + 随机数，保证唯一性） */
function genId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 规范化快照 data（published 状态）：主题回退、页面补全四页 */
function normalizeData(data) {
  return {
    theme: isThemeId(data?.theme) ? data.theme : 'business',
    pages: normalizePages(data?.pages),
  }
}

/** 创建快照对象（AC-13.2）：含 id / time / note / data；data 为 published 的原样深拷贝 */
export function createSnapshot(published, note = '') {
  return {
    id: genId(),
    time: Date.now(),
    note: typeof note === 'string' ? note : '',
    data: JSON.parse(JSON.stringify(published)),
  }
}

/** 追加快照到列表，超限淘汰最旧（AC-13.2 FIFO）；返回新数组，不修改原数组 */
export function pushSnapshot(list, snap) {
  const next = [...(Array.isArray(list) ? list : []), snap]
  return next.length > MAX_SNAPSHOTS ? next.slice(next.length - MAX_SNAPSHOTS) : next
}

/** 规范化快照列表（AC-13.2）：过滤无 id 的非法项，补全 data / note 字段 */
export function normalizeSnapshots(list) {
  if (!Array.isArray(list)) return []
  return list
    .filter((s) => s && typeof s === 'object' && s.id)
    .map((s) => ({
      id: s.id,
      time: typeof s.time === 'number' ? s.time : 0,
      note: typeof s.note === 'string' ? s.note : '',
      data: normalizeData(s.data),
    }))
}

/** 按 id 查找快照，未命中返回 null */
export function snapshotById(list, id) {
  const list_ = Array.isArray(list) ? list : []
  return list_.find((s) => s.id === id) ?? null
}
