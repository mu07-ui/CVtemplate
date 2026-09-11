/**
 * A4 简历生成：从画布数据抽取文字信息套入独立简历模板
 * 覆盖验收标准：AC-6.6
 */
import { pickText } from './i18n.js'
import { flattenPages } from './pages.js'

/** 从站点数据抽取简历结构化信息（兼容 v1 视图与 v2 契约输入） */
export function extractResumeData(site) {
  const locale = site?.locale ?? 'zh'
  const els = Array.isArray(site?.elements)
    ? site.elements
    : flattenPages(site?.draft ?? site?.published ?? {}, locale).elements
  const texts = els.filter((e) => e.type === 'text' && e.props?.content)

  // 姓名 = 字号最大的文本；其余长文本作为简介段落
  const sorted = [...texts].sort((a, b) => (b.props.fontSize ?? 0) - (a.props.fontSize ?? 0))
  const name = pickText(sorted[0]?.props.content, locale).trim() || '姓名'
  const intro = texts
    .filter((t) => t !== sorted[0])
    .map((t) => pickText(t.props.content, locale).trim())
    .filter((c) => c.length > 10)
    .join('\n')

  const skills = els
    .filter((e) => e.type === 'skillTag')
    .flatMap((e) => e.props?.tags ?? [])

  const links = els
    .filter((e) => e.type === 'link' && e.props?.url)
    .map((e) => ({ title: pickText(e.props.title, locale) || e.props.url, url: e.props.url }))

  const photos = els
    .flatMap((e) => (e.type === 'gallery' ? (e.props?.images ?? []) : e.type === 'image' && e.props?.src ? [e.props] : []))
    .filter((im) => im.src)
    .slice(0, 6)

  return { name, intro, skills, links, photos }
}

/** 生成 A4 简历 HTML（浏览器打印即得 PDF，含自动打印脚本） */
export function buildResumeHtml(site) {
  const r = extractResumeData(site)
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${r.name} - 个人简历</title>
<style>
@page { size: A4; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Source Han Sans SC', 'Microsoft YaHei', sans-serif; color: #2b2f36; background: #f0f1f3; }
.sheet { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 16mm; background: #fff; }
header { border-bottom: 3px solid #2f54eb; padding-bottom: 12px; margin-bottom: 16px; }
h1 { font-size: 30px; letter-spacing: 2px; }
.sub { margin-top: 6px; color: #5a6472; font-size: 13px; }
h2 { font-size: 15px; color: #2f54eb; margin: 18px 0 8px; padding-left: 8px; border-left: 4px solid #2f54eb; }
.intro { white-space: pre-wrap; line-height: 1.8; font-size: 13px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { padding: 3px 12px; border-radius: 999px; font-size: 12px; background: #eef2ff; color: #2f54eb; }
ul.links { list-style: none; }
ul.links li { margin: 4px 0; font-size: 13px; }
ul.links a { color: #2f54eb; text-decoration: none; word-break: break-all; }
.photos { display: flex; flex-wrap: wrap; gap: 8px; }
.photos img { width: calc(33.3% - 6px); height: 90px; object-fit: cover; border-radius: 4px; border: 1px solid #e3e6eb; }
.empty { color: #9aa3af; font-size: 12px; }
@media print { body { background: #fff; } .sheet { margin: 0; } }
</style>
</head>
<body>
<div class="sheet">
  <header>
    <h1>${r.name}</h1>
    <div class="sub">个人作品集简历</div>
  </header>
  <h2>个人简介</h2>
  <p class="intro">${r.intro || '<span class="empty">（暂无简介）</span>'}</p>
  <h2>技能特长</h2>
  <div class="tags">${r.skills.length ? r.skills.map((s) => `<span class="tag">${s}</span>`).join('') : '<span class="empty">（暂无技能标签）</span>'}</div>
  <h2>作品展示</h2>
  <div class="photos">${r.photos.length ? r.photos.map((im) => `<img src="${im.src}" alt="${im.caption ?? ''}">`).join('') : '<span class="empty">（暂无作品图片）</span>'}</div>
  <h2>相关链接</h2>
  <ul class="links">${r.links.length ? r.links.map((l) => `<li><a href="${l.url}" target="_blank" rel="noopener">${l.title}：${l.url}</a></li>`).join('') : '<li><span class="empty">（暂无链接）</span></li>'}</ul>
</div>
<script>window.addEventListener('load', function () { setTimeout(function () { window.print() }, 300) })</script>
</body>
</html>
`
}
