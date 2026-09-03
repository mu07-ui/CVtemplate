# 当前上下文（Active Context）

> 每个会话开始时阅读本文件 + progress.md，快速恢复工作状态。

## 当前状态：四分区分页导航 + 示例图文定稿完成，待浏览器视觉确认

**最近完成**（2026-09-03 第四批，分区分页导航 + 版式定稿）：
- 新增 AC-9（分区分页导航 6 条）：sections 数据契约、页码/翻页/跳转、滚动高亮、响应式、导出同步、示例图文定稿
- `src/core/sections.js` 纯逻辑：normalizeSections（y 缺省=100、0 合法）/ sectionIndexAt（容差 0.01）/ clampIndex
- 数据契约扩展：serialize/deserialize 增加 `sections: [{name, y}]`（默认 []）；store 快照/恢复/导入/示例重置均同步
- `SectionNav.vue`：固定右侧分页导航（页码+分区名、上一页/下一页、点击平滑跳转），≤640px 紧凑为纯页码
- `DisplayPage.vue`：window scroll 进度 → 当前分区高亮；页码 goto 平滑滚动
- 导出页运行时同步同款分页导航（自包含，无外部引用）
- 示例内容定稿（AC-9.6）：pageHeight=400 四屏，sections 0/25/50/75 = 首页/作品/案例/项目；5 张示例图（trae 图源）+ 相册/项目图文卡 + 6 个外链卡 + B站视频；**版式定稿，后续仅替换内容**
- 测试 **77/77 全绿**（新增 sections.test.js 5 例 + storage/pages/export 各 1~2 例）；构建分包正常

## 下一步（按序）
1. 浏览器视觉走查（WebView 上轮超时）：`#/` 查看四屏 + 右侧分页导航；编辑器点「恢复官网式示例内容」获取新模板
2. 手动验收清单走查：透明 PNG（AC-2.6）、移动端紧凑分页无横向滚动（AC-2.8 / AC-9.4）
3. （可选）分区编辑 UI（名称/坐标）、图层面板、对齐辅助线
4. 部署走查：dist 产物传 GitHub Pages 验证 AC-7.1

## 活跃决策
- 导出运行时必须自包含（禁止外部引用），源码经 Function.toString 内联
- PDF 走 window.print 方案，不引 jsPDF
- 静态站导出为「免构建」路线：用户拿到 ZIP 即可部署，无需 npm
- 官网化路线：深色沉浸 + 渐变光晕背景 + 滚动叙事 + 进场动画，弃用简历分区式布局

## 待用户确认事项
- 三套主题视觉稿（business 曜蓝商务 / glass 星穹拟态 / pixel 霓虹像素，均为深色沉浸风）
