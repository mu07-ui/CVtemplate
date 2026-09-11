# 当前上下文（Active Context）

> 每个会话开始时阅读本文件 + progress.md，快速恢复工作状态。

## 当前状态：P0–P4 全部里程碑完成（209/209 全绿），属性面板打字误删缺陷已修复，待用户刷新示例数据 + 双平台实际部署验收

**2026-09-12（AC-5.3 修复）**：属性面板输入框内 Backspace/方向键不再误删/误移元素（useEditorHotkeys 守卫 isTypingTarget + isComposing）；快捷键逻辑抽为 composable，EditorPage 186 行；HMR 已生效可直接在编辑器验证

**2026-09-12（AC-10.10 滚轮翻页）**：↓ 提示恢复纯文本样式（不响应点击）；首页→作品集→项目→关于我通过"滚动到底 + 向下滚轮"前进（累积阈值 160 + 1200ms 冷却防触控板惯性；末页不响应；真实浏览器全链路验证通过）。**用户需再点一次「恢复官网式示例内容」**（works/projects 新增了 ↓ 提示元素）

**2026-09-12（示例版式重设计）**：修复「标题裁半、内容挤顶部 25%、下方空白」的版式问题；按 1440×900 基准重排四页（眉题→大标题→分隔线→内容区→底部引导，文本盒=字号×1.6 行距+16:9 余量）；关于页启用 timeline 展示结构化元素；双视口截图验证 + 203 全绿。**用户需在编辑器点「恢复官网式示例内容」加载新版式**（localStorage 旧数据不会自动更新）

**2026-09-12（手动项验证 + 缺陷修复）**：
- 无头 Edge 自动化验证 20/20：手机 375 无横滚、底栏翻页、窄屏编辑提示、file:// 四页路由 + 双语 + 零 fetch
- 修复 P0 起的集成缺陷：router.js 展示路由补 `props: (r) => ({ pageKey: r.meta.pageKey })`（此前真实浏览器导航不切内容）；新增 router-view 集成用例防回归

**2026-09-12（P4 实施完成，AC-11/18）**：
- `core/responsive.js`：BREAKPOINTS(640/1024) + deviceOf + adaptLayout（断点切换坐标不变）；`composables/useDevice.js` 响应式视口感知
- MobileTabBar.vue（手机 fixed 底部四 tab + 中英切换）；ShowcasePage 按断点切换 NavTop / 底栏，resize 实时响应
- EditorPage 窄屏（<640）只显示 `.narrow-tip`「建议使用电脑编辑」中文提示，不挂载面板/画布（AC-11.5）
- viewer-runtime.js 双模式：data.pages → renderMultiSite（hash 四页路由 #/、#/works、#/projects、#/about，未知回 home；顶部 .v-nav-link + 手机 .v-nav-bottom；中英按钮实时重渲染，en 缺失回退 zh）；v1 单视图路径保留
- 导出 v2：exportSite.buildMultiPageHtml 双语原结构内联 id="site-data"（零 fetch，file:// 离线四页可翻页可切语）；particle-inline.js 经 particles.js?raw 内联 createParticles 等引擎 + __pfStart 绘制引导；deploy-guide.js 产出 ZIP 内「部署指引.html」（GitHub Pages/Vercel）；无绝对路径资源
- ZIP：index.html + data.json(v2) + 部署指引.html + 部署说明.txt
- 验证：202/202；build 分包 EditorPage 154.74KB 独立 chunk，展示 chunk 无编辑器文案（AC-18.5）

**2026-09-12（P3 实施完成，AC-16/17）**：
- 元素 11 类（+timeline/skillMatrix/honors/contactCard）+ 元素级 name/visible/locked
- beautify.js（6 字体/图片美化/文本美化/animate）、align.js（阈值 1.5%）、multiselect.js、templates.js（8 组）
- LayerPanel/TemplateLibrary/MultiSelectBar/BeautifyPanel/StructuredProps/CanvasSettings/PropsPanel；useStageDrag.js

**更早里程碑**：P2 五主题+粒子引擎+三档动效；P1 双态发布/快照（上限20）；P0 数据契约 v2 + 四页路由 + 双语 + v1 迁移

## 待用户手动验收（自动化无法覆盖）
> 2026-09-12 已用无头浏览器自动化验证并确认通过：AC-11.3 手机无横滚（375 视口三页 scrollWidth=clientWidth、零越界元素）、AC-11.2 底栏翻页、AC-11.5 窄屏提示、AC-18.3 hash 路由与回退、AC-18.4 file:// 离线四页翻页 + 中英切换 + 零 fetch（20/20 项）；过程中发现并修复路由 pageKey 未传入组件的 P0 集成缺陷（详见 progress.md）
1. **AC-18.1**：编辑器实际导出 ZIP，解压检查四页全量、双语、粒子动效（自动化已用真实样例数据验证导出页逻辑，真实用户数据导出建议抽检一次）
2. **AC-18.2**：部署指引.html 阅读；按 GitHub Pages / Vercel 实际上线一次
3. **AC-19.2**：双平台（GitHub Pages + Vercel）部署后手机/PC 浏览验收；参考站点清单见 docs 附录 A（AC-19.1 文档走查项）

## 遗留小项（不影响验收）
- dev 期 `/favicon.ico` 404 console 噪音（项目无 favicon 文件，可选补一个）

## 活跃决策（后续会话遵守）
- 数据契约 version=2；draft/published 双态；快照只存 published 拷贝（上限 20 FIFO）
- 文本字段三种形态：string / {zh,en}；统一走 `core/i18n.js pickText`
- 粒子引擎单一真源 core/particles.js：编辑器 TechBackdrop 与导出 HTML（particle-inline.js 经 ?raw 内联）共用
- 断点：<640 手机（底部标签栏 + 编辑器禁用）/ 640~1023 平板 / ≥1024 PC；adaptLayout 不改坐标
- viewer-runtime.js 强制自包含：renderSiteInto.toString 内联进 HTML，函数体内禁 import/require/外部变量；外部能力用可选全局（window.__pfStart、typeof PF_THEME）注入
- 导出双语策略：v2 数据原样内联（不提前 resolveBiDeep），语言切换在运行时
- 组件直挂测试无 router 插件 → 共享导航禁用 useRoute/RouterLink，用 hash a 标签 + props 高亮；展示路由组件必须动态 import
- 所有 store 操作在操作**后** pushHistory；测试间重置用 resetSite()
- 单文件 ≤400 行 / 组件 ≤200 行；界面/注释/错误消息一律中文
- jsdom 下 TechBackdrop Canvas getContext「Not implemented」stderr 为既有噪音，非回归

## 若手动验收发现问题
- 按 TDD 流程：更新 docs/acceptance-criteria.md（新增或标注废弃，不改编号语义）→ 红灯测试 → 实现 → 全量转绿
- 每阶段完成同步本文件与 progress.md
