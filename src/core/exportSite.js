/**
 * 静态站导出：独立展示页 HTML + ZIP 打包
 * 覆盖验收标准：AC-6.5 / AC-18（四页 hash 路由 + 双语 + 粒子 + 部署指引）
 */
import JSZip from 'jszip'
import { THEMES, isThemeId } from './theme.js'
import { exportJson, toEmbedUrl } from './storage.js'
import { flattenPages, normalizePages } from './pages.js'
import { LANGS, resolveBiDeep } from './i18n.js'
import { renderSiteInto } from '../export/viewer-runtime.js'
import { buildParticleScript } from '../export/particle-inline.js'
import { buildDeployGuideHtml } from '../export/deploy-guide.js'

const MOTION_LEVELS = ['quiet', 'standard', 'rich']

/** v1 单画布视图规范化：主题回退、页高钳制、字段兜底 */
function normalizeView(site) {
  const ph = Math.round(Number(site?.pageHeight) || 100)
  return {
    theme: isThemeId(site?.theme) ? site.theme : 'business',
    elements: Array.isArray(site?.elements) ? site.elements : [],
    pageHeight: Math.min(500, Math.max(100, ph)),
    sections: Array.isArray(site?.sections) ? site.sections : [],
  }
}

/** 视频外链元素预解析为嵌入地址（AC-8.1），无法识别的平台保留原样 */
function withResolvedVideos(elements) {
  return (elements || []).map((e) => {
    if (e.type === 'video' && e.props?.source === 'link' && e.props?.url) {
      try {
        return { ...e, props: { ...e.props, url: toEmbedUrl(e.props.url) } }
      } catch {
        return e
      }
    }
    return e
  })
}

/** 元素层与氛围背景共享样式（v1 单画布视图与 v2 四页站复用） */
function baseStyle(t, heightVh) {
  return `
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }
body { background: ${t.background}; color: ${t.foreground}; font-family: ${t.font}; overflow-x: hidden; }
.v-stage { position: relative; width: 100%; overflow: hidden; height: ${heightVh ?? 100}vh; background: ${t.backdrop}; background-size: ${t.backdropSize ?? 'auto'}; }
.v-el { position: absolute; opacity: 0; transform: translateY(28px); transition: opacity 0.8s cubic-bezier(0.2, 0.7, 0.3, 1), transform 0.8s cubic-bezier(0.2, 0.7, 0.3, 1); }
.v-el.v-in { opacity: 1; transform: none; }
.v-el.v-no-anim { opacity: 1; transform: none; transition: none; }
.v-fill { width: 100%; height: 100%; object-fit: cover; display: block; }
.v-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: repeating-linear-gradient(45deg, #e8ebf0, #e8ebf0 8px, #dfe3ea 8px, #dfe3ea 16px); color: #9aa3af; font-size: 13px; overflow: hidden; white-space: nowrap; }
.v-text { width: 100%; height: 100%; line-height: 1.5; overflow: hidden; }
.v-link { display: flex; flex-direction: column; justify-content: center; gap: 4px; width: 100%; height: 100%; padding: 10px 14px; text-decoration: none; background: rgba(255, 255, 255, 0.04); border: 1px solid ${t.primary}; border-radius: ${t.radius}; box-shadow: ${t.shadow}; color: ${t.foreground}; backdrop-filter: blur(12px); transition: transform 0.2s, border-color 0.2s; }
.v-link:hover { transform: translateY(-3px); }
.v-link b { color: ${t.primary}; letter-spacing: 0.04em; }
.v-link span { font-size: 12px; opacity: 0.55; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v-tags { display: flex; flex-wrap: wrap; gap: 8px; align-content: center; width: 100%; height: 100%; }
.v-tag { padding: 5px 16px; border-radius: 999px; font-size: 13px; letter-spacing: 0.05em; background: color-mix(in srgb, ${t.primary} 16%, transparent); border: 1px solid color-mix(in srgb, ${t.primary} 45%, transparent); color: ${t.primary}; white-space: nowrap; }
.v-gallery { display: flex; gap: 8px; width: 100%; height: 100%; }
.v-gitem { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.v-gitem img, .v-gitem .v-ph { flex: 1; min-height: 0; width: 100%; border-radius: ${t.radius}; object-fit: cover; }
.v-gitem figcaption { font-size: 12px; opacity: 0.7; text-align: center; }
.v-deco { width: 100%; height: 100%; border-radius: ${t.radius}; }
/* AC-16.1 结构化元素 */
.v-structured { width: 100%; height: 100%; overflow: auto; margin: 0; padding: 0; color: ${t.foreground}; }
.v-tl { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.v-tl li { display: flex; gap: 10px; }
.v-tl-dot { width: 10px; height: 10px; border-radius: 50%; background: ${t.primary}; margin-top: 5px; flex: none; box-shadow: 0 0 8px ${t.primary}; }
.v-tl-body { display: flex; flex-direction: column; gap: 2px; }
.v-tl-date { font-size: 12px; color: ${t.primary}; letter-spacing: 0.08em; }
.v-tl-body b { font-size: 15px; }
.v-tl-desc { font-size: 13px; opacity: 0.7; }
.v-sm { display: flex; flex-direction: column; gap: 10px; }
.v-sm-row { display: flex; align-items: center; gap: 10px; }
.v-sm-row span { width: 90px; flex: none; font-size: 13px; }
.v-sm-track { flex: 1; height: 8px; border-radius: 999px; background: rgba(128,128,128,0.25); overflow: hidden; }
.v-sm-track i { display: block; height: 100%; border-radius: 999px; background: ${t.primary}; }
.v-sm-row em { width: 34px; text-align: right; font-style: normal; font-size: 12px; opacity: 0.7; }
.v-hon { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.v-hon li { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; padding: 8px 12px; border-radius: ${t.radius}; background: rgba(128,128,128,0.1); border: 1px solid ${t.primary}55; }
.v-hon li span { font-size: 12px; opacity: 0.6; }
.v-hon li a { margin-left: auto; font-size: 12px; color: ${t.primary}; text-decoration: none; }
.v-cc { display: flex; flex-direction: column; gap: 8px; }
.v-cc-row { display: flex; gap: 14px; padding: 10px 14px; text-decoration: none; border-radius: ${t.radius}; color: ${t.foreground}; background: rgba(128,128,128,0.1); border: 1px solid ${t.primary}55; }
.v-cc-label { color: ${t.primary}; font-size: 13px; flex: none; }
.v-cc-row span:last-child { font-size: 13px; opacity: 0.8; }
/* 科技氛围背景层（AC-4.5）：细网格 + 星座连线 + 每屏暗角 */
.v-tech { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.vt-grid, .vt-net, .vt-vig { position: absolute; inset: 0; }
.vt-grid { background-image: linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px); background-size: 72px 72px; animation: vt-breathe 14s ease-in-out infinite alternate; }
.vt-net { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 900'%3E%3Cg stroke='rgba(255,255,255,0.13)' stroke-width='1' fill='none'%3E%3Cpath d='M60 140L300 260L560 180'/%3E%3Cpath d='M1100 700L1320 560L1380 760'/%3E%3Cpath d='M180 720L420 830L640 760'/%3E%3Cpath d='M900 150L1120 90L1300 200'/%3E%3C/g%3E%3Cg fill='rgba(125,211,252,0.4)'%3E%3Ccircle cx='60' cy='140' r='3'/%3E%3Ccircle cx='300' cy='260' r='2.5'/%3E%3Ccircle cx='560' cy='180' r='2'/%3E%3Ccircle cx='1100' cy='700' r='3'/%3E%3Ccircle cx='1320' cy='560' r='2.5'/%3E%3Ccircle cx='1380' cy='760' r='2'/%3E%3Ccircle cx='180' cy='720' r='2.5'/%3E%3Ccircle cx='420' cy='830' r='2'/%3E%3Ccircle cx='640' cy='760' r='3'/%3E%3Ccircle cx='900' cy='150' r='2.5'/%3E%3Ccircle cx='1120' cy='90' r='2'/%3E%3Ccircle cx='1300' cy='200' r='3'/%3E%3C/g%3E%3C/svg%3E"); background-size: 100% 100vh; background-repeat: repeat-y; animation: vt-drift 90s linear infinite; }
.vt-vig { background-image: radial-gradient(120% 65% at 50% 50%, transparent 55%, rgba(0,0,0,0.38) 100%); background-size: 100% 100vh; background-repeat: repeat-y; }
@keyframes vt-breathe { from { opacity: 0.55; } to { opacity: 1; } }
@keyframes vt-drift { from { background-position: 0 0; } to { background-position: 0 100vh; } }
/* 分区分页导航（AC-9.2 / AC-9.4）：固定右侧，窄屏紧凑 */
.sec-nav { position: fixed; right: 20px; top: 50%; transform: translateY(-50%); z-index: 999; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.sec-nav button { display: flex; align-items: center; gap: 8px; justify-content: flex-end; padding: 6px 10px; border: 1px solid ${t.primary}; border-radius: 999px; background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); color: ${t.foreground}; font-size: 12px; letter-spacing: 0.05em; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
.sec-nav button:hover:not(:disabled) { border-color: ${t.accent}; }
.sec-nav button:disabled { opacity: 0.35; cursor: not-allowed; }
.sec-name { opacity: 0.7; }
.sec-num.active { color: ${t.primary}; background: color-mix(in srgb, ${t.primary} 14%, transparent); }
.sec-num.active .sec-name { opacity: 1; }
@media (max-width: 640px) { .sec-nav { right: 10px; gap: 7px; } .sec-name { display: none; } .sec-nav button { padding: 4px 8px; font-size: 11px; } }
`
}

/** AC-18 四页站：顶部导航 / 手机底部标签栏 / 粒子画布样式 */
function multiNavStyle(t) {
  return `
.vp-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.v-nav { position: fixed; left: 0; right: 0; z-index: 200; display: flex; align-items: center; gap: 24px; height: 56px; padding: 0 28px; background: rgba(10,15,30,0.62); backdrop-filter: blur(18px); border-bottom: 1px solid rgba(255,255,255,0.08); }
.v-nav-top { top: 0; }
.v-nav-link { color: ${t.foreground}; text-decoration: none; font-size: 14px; letter-spacing: 0.06em; opacity: 0.6; transition: opacity .2s, color .2s; }
.v-nav-link:hover, .v-nav-link.active { opacity: 1; color: ${t.primary}; }
.v-lang { margin-left: auto; display: flex; gap: 8px; }
.v-lang button { border: 1px solid rgba(255,255,255,0.18); background: transparent; color: ${t.foreground}; border-radius: 999px; font-size: 12px; padding: 4px 12px; cursor: pointer; opacity: .75; }
.v-lang button.active { border-color: ${t.primary}; color: ${t.primary}; opacity: 1; }
.mp-stage { position: relative; z-index: 1; }
.v-nav-bottom { display: none; }
@media (max-width: 640px) {
  .v-nav-top { display: none; }
  .v-nav-bottom { display: flex; top: auto; bottom: 0; height: auto; justify-content: space-around; padding: 6px 8px calc(6px + env(safe-area-inset-bottom, 0px)); border-bottom: none; border-top: 1px solid rgba(255,255,255,0.08); }
  .v-nav-tab { color: ${t.foreground}; text-decoration: none; font-size: 12px; opacity: .6; padding: 6px 8px; border-radius: 8px; }
  .v-nav-tab.active { opacity: 1; color: ${t.primary}; background: rgba(125,211,252,0.12); }
}
`
}

/**
 * v1：单画布视图独立 HTML（多页站点请用 buildMultiPageHtml）
 * @param {object} site 单画布视图数据（theme/elements/pageHeight/sections）
 */
export function buildStandaloneHtml(site) {
  const data = normalizeView(site)
  const elements = withResolvedVideos(data.elements)
  const t = THEMES[data.theme] ?? THEMES.business
  // 转义 < 防止内容截断内联脚本
  const dataJson = JSON.stringify({ ...data, elements }).replace(/</g, '\\u003c')
  const runtime = renderSiteInto.toString().replace(/<\/script/gi, '<\\/script')

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>个人作品集</title>
<style>${baseStyle(t, data.pageHeight ?? 100)}</style>
</head>
<body>
<div id="app"></div>
<script type="application/json" id="site-data">${dataJson}</script>
<script>
${runtime}
renderSiteInto(document.getElementById('app'), JSON.parse(document.getElementById('site-data').textContent));
</script>
</body>
</html>
`
}

/**
 * AC-18 v2 四页站独立 HTML：
 * 数据整体内联（双语原文，由运行时切换）+ hash 路由 + 粒子引擎，file:// 离线可用
 * @param {object} site 完整站点数据（locale/motion/draft.pages）
 */
export function buildMultiPageHtml(site) {
  const locale = LANGS.includes(site?.locale) ? site.locale : 'zh'
  const level = MOTION_LEVELS.includes(site?.motion?.level) ? site.motion.level : 'standard'
  const themeId = isThemeId(site?.draft?.theme) ? site.draft.theme : 'business'
  // 固定补全四页；视频外链导出时预解析；双语字段保持原结构内联
  const pages = normalizePages(site?.draft?.pages).map((p) => ({
    ...p,
    elements: withResolvedVideos(p.elements),
  }))
  const payload = { version: 2, locale, motion: { level }, theme: themeId, pages }
  const t = THEMES[themeId] ?? THEMES.business
  const dataJson = JSON.stringify(payload).replace(/</g, '\\u003c')
  const runtime = renderSiteInto.toString().replace(/<\/script/gi, '<\\/script')
  const themeTable = Object.fromEntries(
    Object.entries(THEMES).map(([id, th]) => [id, { scene: th.particleScene, primary: th.primary, accent: th.accent }]),
  )
  const particle = buildParticleScript(themeTable).replace(/<\/script/gi, '<\\/script')

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>个人作品集</title>
<style>${baseStyle(t, 100)}${multiNavStyle(t)}</style>
</head>
<body>
<div id="app"></div>
<noscript><nav><a href="#/">首页</a> <a href="#/works">作品集</a> <a href="#/projects">项目</a> <a href="#/about">关于我</a></nav></noscript>
<script type="application/json" id="site-data">${dataJson}</script>
<script>
${particle}
${runtime}
renderSiteInto(document.getElementById('app'), JSON.parse(document.getElementById('site-data').textContent));
</script>
</body>
</html>
`
}

/**
 * 打包可部署静态站 ZIP：index.html + data.json + 部署指引
 * @param {object} site 站点数据（v2 契约：含 draft.pages；兼容 v1 单画布视图）
 * @param {string} type jszip 产物类型（浏览器默认 blob，测试可传 uint8array）
 */
export async function buildSiteZip(site, type = 'blob') {
  const locale = LANGS.includes(site?.locale) ? site.locale : 'zh'
  const zip = new JSZip()
  if (site?.draft && Array.isArray(site.draft.pages)) {
    // AC-18：四页 hash 路由版（双语原结构内联，运行时切换，离线可翻页）
    zip.file('index.html', buildMultiPageHtml(site))
  } else {
    // v1 过渡路径：多页合成单画布视图并把双语解析为当前语言
    const view = resolveBiDeep(flattenPages(site, locale), locale)
    zip.file('index.html', buildStandaloneHtml(view))
  }
  zip.file('data.json', exportJson(site))
  zip.file('部署指引.html', buildDeployGuideHtml())
  zip.file('部署说明.txt', '部署方法：\n1. 解压后双击 index.html 即可离线浏览；详细步骤请打开「部署指引.html」。\n2. 将本文件夹内所有文件上传至任意静态托管（GitHub Pages / Vercel / Netlify 等）即可公开访问。\n3. data.json 为站点数据备份，可在编辑器中重新导入。')
  return zip.generateAsync({ type })
}
