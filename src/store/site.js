import { reactive, ref } from 'vue'
import { createElement } from '../core/schema.js'
import { createHistory } from '../core/history.js'
import { applyTheme, isThemeId } from '../core/theme.js'
import { save, load, exportJson, importJson, MOTION_LEVELS } from '../core/storage.js'
import { PAGE_KEYS } from '../core/pages.js'
import { LANGS } from '../core/i18n.js'
import { createSnapshot, pushSnapshot, snapshotById, normalizeSnapshots } from '../core/snapshots.js'
import { instantiateTemplate } from '../core/templates.js'
import { shiftToggle, boxSelect, moveMany, alignElements } from '../core/multiselect.js'

/**
 * 示例图片（远程图源，替换时直接换 src 即可，无需动版式）
 */
const IMG = {
  portrait:
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20photo%20of%20a%20young%20creative%20developer%2C%20dark%20studio%20background%2C%20cyan%20rim%20lighting%2C%20confident%2C%20cinematic&image_size=portrait_4_3',
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

/** 双语快捷构造 */
const bi = (zh, en = '') => ({ zh, en })

/**
 * 预填示例内容（AC-7.3 / AC-10.8）：四页双语官网式内容。
 * 版式基准 1440×900：字号随画布宽等比缩放（编辑器 scale / 展示与导出 vw），
 * 文本盒高度 = 字号 × 1.6 行距并预留 16:9 宽屏余量；每页内容纵向铺满 100vh，
 * 按游戏官网习惯组织：眉题 → 大标题 → 分隔线 → 内容区块 → 底部引导。
 */
function sampleSiteV2() {
  const draft = {
    theme: 'glass',
    pages: { home: [], works: [], projects: [], about: [] },
  }

  // ── 首页：全屏居中 Hero（头像 → 眉题 → 大标题 → 副标题 → 简介 → 标签 → CTA → 滚动提示）──
  draft.pages.home = [
    createElement('decoration', { shape: 'block', color: '#7dd3fc', opacity: 0.3, blur: 90, x: 55, y: 2, w: 45, h: 14, z: 0 }),
    createElement('decoration', { shape: 'block', color: '#a78bfa', opacity: 0.28, blur: 100, x: 0, y: 55, w: 30, h: 12, z: 0 }),
    createElement('image', { src: IMG.portrait, alt: bi('个人形象照', 'Portrait'), radius: 50, x: 46.4, y: 14, w: 7.2, h: 11.5, z: 2 }),
    createElement('text', { content: bi('PORTFOLIO · 个人作品集', 'PORTFOLIO · Showcase'), fontSize: 13, align: 'center', color: '#8fa3c8', x: 30, y: 28, w: 40, h: 2.6, z: 3 }),
    createElement('text', { content: bi('以热爱 · 创造体验', 'Craft with Passion'), fontSize: 72, weight: 700, align: 'center', color: '#eaf2ff', x: 10, y: 31.5, w: 80, h: 14.5, z: 3 }),
    createElement('text', { content: bi('张三 — 前端工程师 / 数字媒体创作者', 'Zhang San — Frontend Engineer / Digital Media Creator'), fontSize: 18, align: 'center', color: '#b8c9e8', x: 15, y: 47, w: 70, h: 3.8, z: 3 }),
    createElement('text', { content: bi('在代码与设计的交界处打磨作品，专注交互体验、可视化与创意表达。', 'Polishing works between code and design — interaction, visualization and creative coding.'), fontSize: 15, align: 'center', color: '#8fa3c8', x: 22, y: 52, w: 56, h: 6, z: 3 }),
    createElement('skillTag', { tags: ['Vue', 'TypeScript', 'Node.js', 'Figma', 'Blender'], align: 'center', x: 25, y: 59.5, w: 50, h: 3.5, z: 3 }),
    createElement('decoration', { shape: 'line', color: '#7dd3fc', opacity: 0.6, x: 42, y: 64.5, w: 16, h: 0.4, z: 3 }),
    createElement('link', { title: bi('GitHub 主页 →', 'GitHub →'), url: 'https://github.com', x: 33, y: 67.5, w: 34, h: 4.8, z: 3 }),
    createElement('text', { content: bi('↓ 往下探索', '↓ Explore'), fontSize: 12, align: 'center', color: '#8fa3c8', x: 38, y: 88, w: 24, h: 2.6, z: 3 }),
  ]

  // ── 作品集：左对齐区块标题 + 大幅画廊 + 居中双外链 ──
  draft.pages.works = [
    createElement('text', { content: bi('WORKS · 视觉与交互实验', 'WORKS · Visual & Interaction'), fontSize: 13, color: '#8fa3c8', x: 8, y: 8, w: 60, h: 2.6, z: 2 }),
    createElement('text', { content: bi('精选作品', 'Selected Works'), fontSize: 44, weight: 700, color: '#eaf2ff', x: 8, y: 11, w: 50, h: 9, z: 2 }),
    createElement('text', { content: bi('从数据大屏到品牌视觉，持续探索视觉表达与工程实现的结合。', 'From data dashboards to brand visuals — expression meets engineering.'), fontSize: 15, color: '#b8c9e8', x: 8, y: 21, w: 62, h: 3.8, z: 2 }),
    createElement('gallery', {
      images: [
        { src: IMG.dashboard, caption: bi('数据可视化大屏', 'Data Dashboard') },
        { src: IMG.brand, caption: bi('品牌视觉设计', 'Brand Identity') },
        { src: IMG.motion, caption: bi('交互动画实验', 'Motion Experiment') },
      ],
      x: 8, y: 26.5, w: 84, h: 38, z: 2,
    }),
    createElement('text', { content: bi('每件作品都从 0 到 1：调研、原型、视觉与工程落地。', 'Every work from zero to one: research, prototype, visual and engineering.'), fontSize: 15, align: 'center', color: '#8fa3c8', x: 12, y: 68.5, w: 76, h: 3.6, z: 2 }),
    createElement('link', { title: bi('Behance 作品集 →', 'Behance →'), url: 'https://www.behance.net', x: 20, y: 75, w: 28, h: 5, z: 2 }),
    createElement('link', { title: bi('GitHub 主页 →', 'GitHub →'), url: 'https://github.com', x: 52, y: 75, w: 28, h: 5, z: 2 }),
    createElement('text', { content: bi('更多实验持续更新中…', 'More experiments coming soon…'), fontSize: 12, align: 'center', color: '#8fa3c8', x: 30, y: 86, w: 40, h: 2.6, z: 2 }),
    createElement('text', { content: bi('↓ 往下探索', '↓ Explore'), fontSize: 12, align: 'center', color: '#8fa3c8', x: 38, y: 91, w: 24, h: 2.6, z: 2 }),
  ]

  // ── 项目：双列图文项目卡 + 分隔线 + 底部协作引导 ──
  draft.pages.projects = [
    createElement('decoration', { shape: 'block', color: '#38bdf8', opacity: 0.22, blur: 110, x: 0, y: 4, w: 35, h: 12, z: 0 }),
    createElement('text', { content: bi('PROJECTS · 长期投入', 'PROJECTS · Long-term'), fontSize: 13, color: '#8fa3c8', x: 8, y: 8, w: 60, h: 2.6, z: 2 }),
    createElement('text', { content: bi('在研项目', 'Ongoing Projects'), fontSize: 44, weight: 700, color: '#eaf2ff', x: 8, y: 11, w: 50, h: 9, z: 2 }),
    createElement('image', { src: IMG.starmap, alt: bi('星图可视化引擎', 'Starmap Engine'), x: 8, y: 26, w: 42, h: 30, z: 2 }),
    createElement('text', { content: bi('星图可视化引擎 — WebGL 星空渲染', 'Starmap Engine — WebGL rendering'), fontSize: 16, color: '#eaf2ff', x: 8, y: 58.5, w: 42, h: 3.8, z: 2 }),
    createElement('link', { title: bi('了解项目 →', 'Learn More →'), url: 'https://github.com', x: 8, y: 63.5, w: 20, h: 4.8, z: 2 }),
    createElement('image', { src: IMG.pixelgame, alt: bi('像素风格独立游戏', 'Pixel Indie Game'), x: 52, y: 26, w: 40, h: 30, z: 2 }),
    createElement('text', { content: bi('像素风格独立游戏 — 《星尘旅人》', 'Pixel Indie Game — Stardust Traveler'), fontSize: 16, color: '#eaf2ff', x: 52, y: 58.5, w: 40, h: 3.8, z: 2 }),
    createElement('link', { title: bi('游戏页面 →', 'Game Page →'), url: 'https://store.steampowered.com', x: 52, y: 63.5, w: 20, h: 4.8, z: 2 }),
    createElement('decoration', { shape: 'line', color: '#7dd3fc', opacity: 0.5, x: 8, y: 73, w: 84, h: 0.4, z: 2 }),
    createElement('text', { content: bi('两个项目并行开发中，欢迎通过 GitHub 关注最新进展，或联系我聊聊合作。', 'Two projects in parallel — follow on GitHub or reach out for collaboration.'), fontSize: 15, align: 'center', color: '#8fa3c8', x: 12, y: 77.5, w: 76, h: 3.6, z: 2 }),
    createElement('skillTag', { tags: ['WebGL', 'Three.js', 'Canvas', '像素艺术'], align: 'center', x: 25, y: 83, w: 50, h: 3.5, z: 2 }),
    createElement('text', { content: bi('↓ 往下探索', '↓ Explore'), fontSize: 12, align: 'center', color: '#8fa3c8', x: 38, y: 91, w: 24, h: 2.6, z: 2 }),
  ]

  // ── 关于我：标题 + 简介双段 + 形象照 + 外链 + 经历时间线 ──
  draft.pages.about = [
    createElement('decoration', { shape: 'block', color: '#a78bfa', opacity: 0.24, blur: 100, x: 60, y: 6, w: 40, h: 14, z: 0 }),
    createElement('text', { content: bi('ABOUT · 关于我', 'ABOUT · Me'), fontSize: 13, color: '#8fa3c8', x: 8, y: 8, w: 60, h: 2.6, z: 2 }),
    createElement('text', { content: bi('关于我', 'About Me'), fontSize: 44, weight: 700, color: '#eaf2ff', x: 8, y: 11, w: 40, h: 9, z: 2 }),
    createElement('image', { src: IMG.portrait, alt: bi('个人形象照', 'Portrait'), radius: 8, x: 74, y: 10, w: 18, h: 27, z: 2 }),
    createElement('text', { content: bi('你好，我是张三。一名热衷于把想法变成可交互体验的前端工程师，长期关注可视化、创意编程与设计系统工程化，相信技术与设计的结合能带来打动人心的产品。', 'Hi, I am Zhang San — a frontend engineer turning ideas into interactive experiences, with a focus on visualization, creative coding and design engineering.'), fontSize: 16, color: '#b8c9e8', x: 8, y: 22.5, w: 60, h: 8, z: 2 }),
    createElement('text', { content: bi('工作之外我喜欢摄影、合成器音乐与开源社区，相信技术是创意的放大器。', 'Photography, synth music and open source in my spare time.'), fontSize: 15, color: '#8fa3c8', x: 8, y: 31.5, w: 60, h: 6, z: 2 }),
    createElement('skillTag', { tags: ['Vue', 'TypeScript', 'WebGL', 'Node.js'], x: 8, y: 39.5, w: 50, h: 3.5, z: 2 }),
    createElement('link', { title: bi('邮箱联系 →', 'Email →'), url: 'mailto:me@example.com', x: 8, y: 45.5, w: 26, h: 5, z: 2 }),
    createElement('link', { title: bi('技术博客 →', 'Blog →'), url: 'https://juejin.cn', x: 37, y: 45.5, w: 26, h: 5, z: 2 }),
    createElement('decoration', { shape: 'line', color: '#7dd3fc', opacity: 0.5, x: 8, y: 55.5, w: 84, h: 0.4, z: 2 }),
    createElement('timeline', {
      items: [
        { date: '2024 — 至今', title: bi('独立开发者 · 可视化方向', 'Indie Developer · Visualization'), desc: bi('维护开源组件库，承接数据可视化与创意项目', 'Maintaining OSS libraries and visualization projects') },
        { date: '2021 — 2024', title: bi('某互联网公司 · 前端工程师', 'Frontend Engineer'), desc: bi('负责数据大屏与设计系统建设', 'Data dashboards and design systems') },
        { date: '2018 — 2021', title: bi('数字媒体艺术 · 本科', 'BA, Digital Media Art'), desc: bi('接触创意编程，开始作品集创作', 'Started creative coding and portfolio works') },
      ],
      x: 8, y: 59, w: 60, h: 26, z: 2,
    }),
  ]

  const normalized = PAGE_KEYS.map((key) => ({ key, elements: draft.pages[key] }))
  const state = { theme: draft.theme, pages: normalized }
  return {
    locale: 'zh',
    motion: { level: 'standard' },
    published: JSON.parse(JSON.stringify(state)),
    draft: state,
    snapshots: [],
  }
}

const history = createHistory()
const snapshot = () => JSON.stringify({ theme: site.draft.theme, pages: site.draft.pages })
let lastPushed = null

export const site = reactive(load() ?? sampleSiteV2())
export const selectedId = ref(null)
export const selectedIds = ref([]) // AC-17.4 多选集合（单选时含 1 个 id）
export const currentPage = ref('home') // 编辑器当前编辑页（AC-10.6）
export const canUndo = ref(false)
export const canRedo = ref(false)

/** 跨页查找元素，返回元素与其所在页 */
function findEl(id) {
  for (const p of site.draft.pages) {
    const el = p.elements.find((e) => e.id === id)
    if (el) return { el, page: p }
  }
  return null
}

function refreshFlags() {
  canUndo.value = history.canUndo()
  canRedo.value = history.canRedo()
}

/** 初始化：应用主题 + 预压初始快照（保证首个操作可撤销） */
export function initSite() {
  applyTheme(site.draft.theme)
  history.reset()
  lastPushed = null
  pushHistory()
}

/** 重置为示例内容（测试 / 恢复官网式示例用） */
export function resetSite() {
  const s = sampleSiteV2()
  site.locale = s.locale
  site.motion = s.motion
  site.draft = s.draft
  site.published = s.published
  site.snapshots = []
  currentPage.value = 'home'
  selectedId.value = null
  selectedIds.value = []
  applyTheme(site.draft.theme)
  history.reset()
  lastPushed = null
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
  site.draft.theme = d.theme
  site.draft.pages = d.pages
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
  site.draft.theme = id
  applyTheme(id)
  pushHistory()
  save(site)
}

/** 编辑器切换当前编辑页 */
export function setCurrentPage(key) {
  if (PAGE_KEYS.includes(key)) currentPage.value = key
}

/** 当前页页高（vh，100~500） */
export function setPageHeight(vh) {
  const page = site.draft.pages.find((p) => p.key === currentPage.value)
  if (!page) return
  page.pageHeight = Math.min(500, Math.max(100, Math.round(Number(vh) || 100)))
  pushHistory()
  save(site)
}

/** 切换展示语言并持久化（AC-12.2） */
export function setLocale(lang) {
  if (!LANGS.includes(lang)) return
  site.locale = lang
  save(site)
}

/** 切换动效档位并持久化（AC-15.2） */
export function setMotion(level) {
  if (!MOTION_LEVELS.includes(level)) return
  site.motion = { level }
  save(site)
}

/** 发布：把草稿覆盖到正式态并自动生成快照（AC-13.2） */
export function publishDraft(note = '') {
  const pub = JSON.parse(JSON.stringify(site.draft))
  site.published = pub
  const snap = createSnapshot(pub, note)
  site.snapshots = pushSnapshot(site.snapshots, snap)
  save(site)
}

/** 回滚快照：把快照 data 写入草稿态，不覆盖正式态（AC-13.3）；可撤销 */
export function restoreSnapshot(id) {
  const snap = snapshotById(site.snapshots, id)
  if (!snap) return
  site.draft = JSON.parse(JSON.stringify(snap.data))
  applyTheme(site.draft.theme)
  selectedId.value = null
  selectedIds.value = []
  lastPushed = null // 强制压栈，使撤销能回到回滚前
  pushHistory()
  save(site)
}

/** 还原：放弃草稿回到最近一次发布状态（AC-13.4）；可撤销 */
export function revertDraft() {
  site.draft = JSON.parse(JSON.stringify(site.published))
  applyTheme(site.draft.theme)
  selectedId.value = null
  selectedIds.value = []
  lastPushed = null
  pushHistory()
  save(site)
}

/** 是否存在未发布的草稿改动（AC-13.4 二次确认用） */
export function hasUnpublishedChanges() {
  return JSON.stringify(site.draft) !== JSON.stringify(site.published)
}

/** 恢复内置官网式示例内容（用于体验新版模板，可撤销） */
export function resetToSample() {
  const s = sampleSiteV2()
  site.draft = JSON.parse(JSON.stringify(s.draft))
  applyTheme(site.draft.theme)
  selectedId.value = null
  selectedIds.value = []
  lastPushed = null
  pushHistory()
  save(site)
}

export function addElement(type) {
  const page = site.draft.pages.find((p) => p.key === currentPage.value)
  const el = createElement(type)
  page.elements.push(el)
  selectedId.value = el.id
  selectedIds.value = [el.id]
  pushHistory()
  save(site)
  return el
}

export function removeElement(id) {
  const hit = findEl(id)
  if (!hit) return
  hit.page.elements.splice(hit.page.elements.indexOf(hit.el), 1)
  if (selectedId.value === id) selectedId.value = null
  selectedIds.value = selectedIds.value.filter((x) => x !== id)
  pushHistory()
  save(site)
}

export function duplicateElement(id) {
  const hit = findEl(id)
  if (!hit) return
  const src = hit.el
  const el = createElement(src.type, JSON.parse(JSON.stringify(src.props)))
  Object.assign(el, {
    x: Math.min(src.x + 1, 99), y: Math.min(src.y + 1, 99),
    w: src.w, h: src.h, z: src.z,
    name: src.name, visible: src.visible, locked: src.locked,
  })
  hit.page.elements.push(el)
  selectedId.value = el.id
  selectedIds.value = [el.id]
  pushHistory()
  save(site)
}

/** 拖拽过程中的实时更新：只保存不进历史，落点时由 commit() 压栈 */
export function updateElement(id, patch) {
  const hit = findEl(id)
  if (!hit) return
  Object.assign(hit.el, patch)
  save(site)
}

export function moveElementLayer(id, action) {
  const hit = findEl(id)
  if (!hit) return
  const sorted = [...hit.page.elements].sort((a, b) => a.z - b.z)
  const i = sorted.indexOf(hit.el)
  let j = i
  if (action === 'up') j = Math.min(i + 1, sorted.length - 1)
  else if (action === 'down') j = Math.max(i - 1, 0)
  else if (action === 'top') j = sorted.length - 1
  else if (action === 'bottom') j = 0
  const [el] = sorted.splice(i, 1)
  sorted.splice(j, 0, el)
  sorted.forEach((e, idx) => { e.z = idx })
  pushHistory()
  save(site)
}

/* ── AC-17.1 图层面板：显隐 / 锁定 / 改名 ─────────────────────── */

/** 切换元素显隐 */
export function toggleVisible(id) {
  const hit = findEl(id)
  if (!hit) return
  hit.el.visible = !hit.el.visible
  pushHistory()
  save(site)
}

/** 切换元素锁定（锁定后画布不可拖拽） */
export function toggleLocked(id) {
  const hit = findEl(id)
  if (!hit) return
  hit.el.locked = !hit.el.locked
  pushHistory()
  save(site)
}

/** 元素改名 */
export function renameElement(id, name) {
  const hit = findEl(id)
  if (!hit || typeof name !== 'string') return
  hit.el.name = name
  save(site)
}

/* ── AC-17.4 多选与批量操作 ──────────────────────────────────── */

/** 点选：additive=false 替换选择；true 为 Shift 加选/减选 */
export function toggleSelection(id, additive) {
  if (!id) {
    clearSelection()
    return
  }
  if (!additive) {
    selectedIds.value = [id]
    selectedId.value = id
    return
  }
  selectedIds.value = shiftToggle(selectedIds.value, id)
  selectedId.value = selectedIds.value.includes(id)
    ? id
    : selectedIds.value[selectedIds.value.length - 1] ?? null
}

export function clearSelection() {
  selectedIds.value = []
  selectedId.value = null
}

/** 框选：替换为与框选矩形相交的元素 */
export function setBoxSelection(box) {
  const page = site.draft.pages.find((p) => p.key === currentPage.value)
  if (!page) return
  selectedIds.value = boxSelect(page.elements, box)
  selectedId.value = selectedIds.value[0] ?? null
}

/** 批量删除选中元素 */
export function removeSelected() {
  if (selectedIds.value.length === 0) return
  const ids = new Set(selectedIds.value)
  for (const p of site.draft.pages) {
    p.elements = p.elements.filter((e) => !ids.has(e.id))
  }
  clearSelection()
  pushHistory()
  save(site)
}

/** 拖拽中批量移动：以锚点元素的绝对目标坐标推导整体位移；只保存不进历史 */
export function dragSelectedTo(anchorId, x, y) {
  const page = site.draft.pages.find((p) => p.key === currentPage.value)
  if (!page || selectedIds.value.length < 2) return
  const anchor = page.elements.find((e) => e.id === anchorId)
  if (!anchor) return
  const dx = x - anchor.x
  const dy = y - anchor.y
  if (dx === 0 && dy === 0) return
  page.elements = moveMany(page.elements, selectedIds.value, dx, dy)
  save(site)
}

/** 批量对齐（left/right/hcenter/top/bottom/vcenter） */
export function alignSelected(type) {
  const page = site.draft.pages.find((p) => p.key === currentPage.value)
  if (!page || selectedIds.value.length < 2) return
  page.elements = alignElements(page.elements, selectedIds.value, type)
  pushHistory()
  save(site)
}

/* ── AC-17.3 区块模板：一键插入当前页 ────────────────────────── */

/** 插入模板：新元素 z 顺延到最上层并整体选中 */
export function insertTemplate(key) {
  const page = site.draft.pages.find((p) => p.key === currentPage.value)
  if (!page) return []
  const baseZ = page.elements.length
  const els = instantiateTemplate(key).map((e, i) => ({ ...e, z: baseZ + i }))
  page.elements.push(...els)
  selectedIds.value = els.map((e) => e.id)
  selectedId.value = els[0]?.id ?? null
  pushHistory()
  save(site)
  return els
}

export function exportSiteJson() {
  return exportJson(site)
}

export function importSiteJson(text) {
  const d = importJson(text) // 非法数据抛中文错误且不影响现有数据（AC-6.4）
  site.locale = d.locale
  site.motion = d.motion
  site.draft = d.draft
  site.published = d.published
  site.snapshots = normalizeSnapshots(d.snapshots)
  applyTheme(site.draft.theme)
  selectedId.value = null
  selectedIds.value = []
  lastPushed = null
  pushHistory()
  save(site)
}

export { snapshot }
