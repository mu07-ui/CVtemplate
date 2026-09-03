import { reactive, ref } from 'vue'
import {
  createElement,
  createText,
  createImage,
  createVideo,
  createLink,
  createSkillTag,
  createGallery,
  createDecoration,
} from '../core/schema.js'
import { createHistory } from '../core/history.js'
import { applyTheme, isThemeId } from '../core/theme.js'
import { save, load, exportJson, importJson } from '../core/storage.js'

/**
 * 示例图片（远程图源，替换时直接换 src 即可，无需动版式）
 */
const IMG = {
  dashboard:
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20data%20visualization%20dashboard%2C%20glowing%20blue%20and%20cyan%20charts%20on%20dark%20background%2C%20cinematic%20lighting%2C%20high%20detail&image_size=landscape_4_3',
  brand:
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=brand%20identity%20design%20mockup%2C%20elegant%20posters%20and%20stationery%2C%20dark%20scene%20with%20blue%20and%20purple%20rim%20lighting%2C%20studio%20photography&image_size=landscape_4_3',
  motion:
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20interactive%20motion%20graphics%2C%20flowing%20luminous%20particles%20and%20waves%2C%20dark%20background%2C%20cyan%20and%20violet%20glow&image_size=landscape_4_3',
  starmap:
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=3D%20galaxy%20visualization%20interface%2C%20star%20map%20with%20glowing%20constellation%20lines%2C%20deep%20space%2C%20sci-fi%20UI%2C%20dark%20blue&image_size=landscape_4_3',
  pixelgame:
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=retro%20pixel%20art%20game%20scene%2C%20fantasy%20world%20with%20neon%20colors%2C%20dramatic%20lighting%2C%20detailed%20pixels&image_size=landscape_4_3',
}

/** 预填示例内容（AC-7.3 / AC-9.6）：官网式四分区纵向叙事（首页→作品→案例→项目），版式定稿仅替换内容 */
function sampleSite() {
  return {
    theme: 'glass',
    pageHeight: 400, // 四屏，每屏 100vh
    sections: [
      { name: '首页', y: 0 },
      { name: '作品', y: 25 },
      { name: '案例', y: 50 },
      { name: '项目', y: 75 },
    ],
    elements: [
      // ── 第一屏 · 首页（0~25%）：氛围光斑 + 大字口号 ──
      createDecoration({ shape: 'block', color: '#7dd3fc', opacity: 0.3, blur: 90, x: 55, y: 1, w: 45, h: 10, z: 0 }),
      createDecoration({ shape: 'block', color: '#a78bfa', opacity: 0.28, blur: 100, x: 0, y: 13, w: 30, h: 8, z: 0 }),
      createText({ content: '以热爱 · 创造体验', fontSize: 56, weight: 700, align: 'center', color: '#eaf2ff', x: 10, y: 5.5, w: 80, h: 4, z: 2 }),
      createText({ content: '张三 — 前端工程师 / 数字媒体创作者', fontSize: 16, align: 'center', color: '#b8c9e8', x: 15, y: 10.5, w: 70, h: 1.8, z: 2 }),
      createText({ content: '在代码与设计的交界处打磨作品，专注交互体验、可视化与创意表达。', fontSize: 14, align: 'center', color: '#8fa3c8', x: 22, y: 13.5, w: 56, h: 3, z: 2 }),
      createSkillTag({ tags: ['Vue', 'TypeScript', 'Node.js', 'Figma', 'Blender'], align: 'center', x: 25, y: 17.5, w: 50, h: 2.5, z: 2 }),
      createDecoration({ shape: 'line', color: '#7dd3fc', opacity: 0.6, x: 42, y: 21.5, w: 16, h: 0.15, z: 2 }),
      createText({ content: '↓  往 下 探 索', fontSize: 12, align: 'center', color: '#8fa3c8', x: 38, y: 22.5, w: 24, h: 1, z: 2 }),

      // ── 第二屏 · 作品（25~50%）：示例图片相册 + 外链 ──
      createText({ content: '精选作品', fontSize: 30, weight: 700, color: '#eaf2ff', x: 8, y: 26.5, w: 40, h: 3, z: 2 }),
      createText({ content: 'WORKS · 视觉与交互实验', fontSize: 12, color: '#8fa3c8', x: 8, y: 30, w: 40, h: 1.4, z: 2 }),
      createGallery({
        images: [
          { src: IMG.dashboard, caption: '数据可视化大屏' },
          { src: IMG.brand, caption: '品牌视觉设计' },
          { src: IMG.motion, caption: '交互动画实验' },
        ],
        x: 8, y: 32.5, w: 84, h: 11, z: 2,
      }),
      createText({ content: '从数据大屏到品牌视觉，持续探索视觉表达与工程实现的结合。', fontSize: 14, align: 'center', color: '#8fa3c8', x: 8, y: 44.5, w: 84, h: 2.5, z: 2 }),
      createLink({ title: 'Behance 作品集 →', url: 'https://www.behance.net', x: 8, y: 48, w: 26, h: 3.5, z: 2 }),

      // ── 第三屏 · 案例（50~75%）：视频演示 + 外链矩阵 ──
      createText({ content: '案例演示', fontSize: 30, weight: 700, color: '#eaf2ff', x: 8, y: 51.5, w: 40, h: 3, z: 2 }),
      createText({ content: 'CASES · 视频 / 文章 / 演示', fontSize: 12, color: '#8fa3c8', x: 8, y: 55, w: 40, h: 1.4, z: 2 }),
      createVideo({ source: 'link', url: 'https://www.bilibili.com/video/BV1xx411c7mD', x: 8, y: 58, w: 50, h: 13, z: 2 }),
      createText({ content: '完整案例演示视频，点击右侧链接了解更多。', fontSize: 14, color: '#8fa3c8', x: 8, y: 72, w: 50, h: 2.5, z: 2 }),
      createLink({ title: 'GitHub →', url: 'https://github.com', x: 62, y: 58, w: 30, h: 5.5, z: 2 }),
      createLink({ title: 'B站空间 →', url: 'https://space.bilibili.com', x: 62, y: 65, w: 30, h: 5.5, z: 2 }),
      createLink({ title: '技术博客 →', url: 'https://juejin.cn', x: 62, y: 72, w: 30, h: 5.5, z: 2 }),

      // ── 第四屏 · 项目（75~100%）：图文项目卡 + 版权 ──
      createDecoration({ shape: 'block', color: '#38bdf8', opacity: 0.22, blur: 110, x: 0, y: 76, w: 35, h: 8, z: 0 }),
      createText({ content: '在研项目', fontSize: 30, weight: 700, color: '#eaf2ff', x: 8, y: 76.5, w: 40, h: 3, z: 2 }),
      createText({ content: 'PROJECTS · 长期投入', fontSize: 12, color: '#8fa3c8', x: 8, y: 80, w: 40, h: 1.4, z: 2 }),
      createImage({ src: IMG.starmap, alt: '星图可视化引擎', x: 8, y: 83, w: 40, h: 6.5, z: 2 }),
      createText({ content: '星图可视化引擎 — WebGL 星空渲染', fontSize: 14, color: '#eaf2ff', x: 8, y: 90.3, w: 40, h: 1.6, z: 2 }),
      createLink({ title: '了解项目 →', url: 'https://github.com', x: 8, y: 92.2, w: 18, h: 3, z: 2 }),
      createImage({ src: IMG.pixelgame, alt: '像素风格独立游戏', x: 52, y: 83, w: 40, h: 6.5, z: 2 }),
      createText({ content: '像素风格独立游戏 — 《星尘旅人》', fontSize: 14, color: '#eaf2ff', x: 52, y: 90.3, w: 40, h: 1.6, z: 2 }),
      createLink({ title: '游戏页面 →', url: 'https://store.steampowered.com', x: 52, y: 92.2, w: 18, h: 3, z: 2 }),
      createText({ content: '© 2026 张三 · 用心打造', fontSize: 11, align: 'center', color: '#6b7fa3', x: 25, y: 97.5, w: 50, h: 1.5, z: 2 }),
    ],
  }
}

const history = createHistory()
const snapshot = () => JSON.stringify({ elements: site.elements, theme: site.theme, pageHeight: site.pageHeight, sections: site.sections })
let lastPushed = null

export const site = reactive(load() ?? sampleSite())
export const selectedId = ref(null)
export const canUndo = ref(false)
export const canRedo = ref(false)

function refreshFlags() {
  canUndo.value = history.canUndo()
  canRedo.value = history.canRedo()
}

/** 初始化：应用主题 + 预压初始快照（保证首个操作可撤销） */
export function initSite() {
  applyTheme(site.theme)
  pushHistory()
}

/** 变更前压栈：在每个原子操作前调用；与上一快照相同则跳过（防止连续输入刷爆历史栈） */
export function pushHistory() {
  const snap = snapshot()
  if (snap === lastPushed) return
  lastPushed = snap
  history.push(snap)
  refreshFlags()
}

function restore(json) {
  const d = JSON.parse(json)
  site.elements = d.elements
  site.theme = d.theme
  site.pageHeight = d.pageHeight ?? 100
  site.sections = Array.isArray(d.sections) ? d.sections : []
  applyTheme(d.theme)
  save(site)
  lastPushed = json
  refreshFlags()
}

export function undo() {
  const s = history.undo()
  if (s) restore(s)
}

export function redo() {
  const s = history.redo()
  if (s) restore(s)
}

export function setTheme(id) {
  if (!isThemeId(id)) return
  pushHistory()
  site.theme = id
  applyTheme(id)
  save(site)
}

/** 画布总高度（vh），官网式纵向叙事 */
export function setPageHeight(vh) {
  const v = Math.min(500, Math.max(100, Math.round(Number(vh) || 100)))
  pushHistory()
  site.pageHeight = v
  save(site)
}

/** 恢复内置官网式示例内容（用于体验新版模板，可撤销） */
export function resetToSample() {
  pushHistory()
  const s = sampleSite()
  site.elements = s.elements
  site.theme = s.theme
  site.pageHeight = s.pageHeight
  site.sections = s.sections
  applyTheme(site.theme)
  selectedId.value = null
  save(site)
}

export function addElement(type) {
  pushHistory()
  const el = createElement(type)
  site.elements.push(el)
  selectedId.value = el.id
  save(site)
  return el
}

export function removeElement(id) {
  const i = site.elements.findIndex((e) => e.id === id)
  if (i === -1) return
  pushHistory()
  site.elements.splice(i, 1)
  if (selectedId.value === id) selectedId.value = null
  save(site)
}

export function duplicateElement(id) {
  const src = site.elements.find((e) => e.id === id)
  if (!src) return
  pushHistory()
  const el = createElement(src.type, JSON.parse(JSON.stringify(src.props)))
  Object.assign(el, { x: Math.min(src.x + 1, 99), y: Math.min(src.y + 1, 99), w: src.w, h: src.h, z: src.z })
  site.elements.push(el)
  selectedId.value = el.id
  save(site)
}

/** 拖拽过程中的实时更新：只保存不进历史，落点时由 commit() 压栈 */
export function updateElement(id, patch) {
  const el = site.elements.find((e) => e.id === id)
  if (!el) return
  Object.assign(el, patch)
  save(site)
}

export function moveElementLayer(id, action) {
  pushHistory()
  const sorted = [...site.elements].sort((a, b) => a.z - b.z)
  const i = sorted.findIndex((e) => e.id === id)
  if (i === -1) return
  let j = i
  if (action === 'up') j = Math.min(i + 1, sorted.length - 1)
  else if (action === 'down') j = Math.max(i - 1, 0)
  else if (action === 'top') j = sorted.length - 1
  else if (action === 'bottom') j = 0
  const [el] = sorted.splice(i, 1)
  sorted.splice(j, 0, el)
  sorted.forEach((e, idx) => { e.z = idx })
  save(site)
}

export function exportSiteJson() {
  return exportJson(site)
}

export function importSiteJson(text) {
  const d = importJson(text) // 非法数据抛中文错误且不影响现有数据（AC-6.4）
  pushHistory()
  site.elements = d.elements
  site.theme = d.theme
  site.pageHeight = d.pageHeight ?? 100
  site.sections = Array.isArray(d.sections) ? d.sections : []
  applyTheme(d.theme)
  save(site)
}

export { snapshot }
