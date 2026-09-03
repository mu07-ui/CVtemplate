/**
 * 静态站导出：独立展示页 HTML + ZIP 打包
 * 覆盖验收标准：AC-6.5
 */
import JSZip from 'jszip'
import { THEMES } from './theme.js'
import { serialize, exportJson, toEmbedUrl } from './storage.js'
import { renderSiteInto } from '../export/viewer-runtime.js'

/**
 * 生成可离线浏览、可直接部署的独立 index.html：
 * 内联主题样式 + 嵌入站点数据 + 无框架渲染运行时（双击即可打开）
 */
export function buildStandaloneHtml(site) {
  const data = serialize(site)

  // 视频外链在导出时预解析为嵌入地址（AC-8.1），运行时保持零依赖
  const elements = data.elements.map((e) => {
    if (e.type === 'video' && e.props?.source === 'link' && e.props?.url) {
      try {
        return { ...e, props: { ...e.props, url: toEmbedUrl(e.props.url) } }
      } catch {
        return e // 无法识别的平台保留原样，渲染层自行降级
      }
    }
    return e
  })

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
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }
body { background: ${t.background}; color: ${t.foreground}; font-family: ${t.font}; }
.v-stage { position: relative; width: 100%; overflow: hidden; height: ${(data.pageHeight ?? 100)}vh; background: ${t.backdrop}; background-size: ${t.backdropSize ?? 'auto'}; }
.v-el { position: absolute; opacity: 0; transform: translateY(28px); transition: opacity 0.8s cubic-bezier(0.2, 0.7, 0.3, 1), transform 0.8s cubic-bezier(0.2, 0.7, 0.3, 1); }
.v-el.v-in { opacity: 1; transform: none; }
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
</style>
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
 * 打包可部署静态站 ZIP：index.html + data.json + 部署说明
 * @param {object} site 站点数据
 * @param {string} type jszip 产物类型（浏览器默认 blob，测试可传 uint8array）
 */
export async function buildSiteZip(site, type = 'blob') {
  const zip = new JSZip()
  zip.file('index.html', buildStandaloneHtml(site))
  zip.file('data.json', exportJson(site))
  zip.file('部署说明.txt', '部署方法：\n1. 将本文件夹内所有文件上传至任意静态托管（GitHub Pages / Vercel / 阿里云 OSS 等）即可公开访问。\n2. 本地预览：直接双击 index.html。\n3. data.json 为站点数据备份，可在编辑器中重新导入。')
  return zip.generateAsync({ type })
}
