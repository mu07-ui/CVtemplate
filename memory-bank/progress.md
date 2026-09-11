# 进度（Progress）

> 状态标记：✅ 完成 / 🔄 进行中 / ⬜ 未开始

## 阶段总览

| 阶段 | 内容 | 状态 |
|---|---|---|
| 0. 需求打磨 | 三轮事件风暴，方案定稿 | ✅ 2026-09-02 |
| 1. 验收标准 + 测试基建 | AC 文档、测试用例、桩模块、红灯验证 | ✅ 2026-09-02 |
| 2. 核心纯逻辑实现 | schema / canvas / history / theme / storage 转绿 | ✅ 2026-09-03 |
| 3. Vue 应用骨架 | 路由、editor 1:3 布局、展示页、分包 | ✅ 2026-09-03 |
| 4. 画布交互 | 拖拽、选中、层级、网格吸附、快捷键 | ✅ 2026-09-03（骨架级） |
| 5. 元素组件 | 七类元素的编辑与渲染（含灯箱、视频嵌入） | 🔄 基础版完成，属性面板待打磨 |
| 6. 主题系统 UI | 三套主题视觉稿 + 切换面板 | ✅ 切换可用，视觉稿待用户确认 |
| 7. 导入导出 | JSON / 静态站 ZIP / A4 PDF 简历 | ✅ 2026-09-03 |
| 8. 示例内容 + 验收走查 | 预填内容 ✅；手动验收清单待走查 | 🔄 |
| 9. v2.0 需求升版 | 五轮事件风暴 + AC v2.0 + 技术设计文档 | ✅ 2026-09-10 |
| 10. P0 数据契约 v2 + 四页路由 + 双语 | migrate / pages / i18n（TDD 红灯先行） | ✅ 2026-09-10 |
| 11. P1 双态发布/快照/还原 | snapshots + publishDraft + restoreSnapshot + revertDraft + PublishPanel | ✅ 2026-09-10 |
| 12. P2 五套主题 + 粒子引擎 + 三档动效 | particles.js + theme 5套 + TechBackdrop Canvas 2D | ✅ 2026-09-10 |
| 13. P3 四类内容元素 + 美化 + 工坊工具 | AC-16/17：schema 11 类 + beautify + align + multiselect + templates + 图层/模板/多选面板 | ✅ 2026-09-12 |
| 14. P4 三端响应式收口 + 导出 v2 + 部署指引 | AC-11/18：responsive 纯逻辑 + 手机底栏 + 窄屏提示 + 四页 hash 路由导出 + 粒子内联 + 部署指引页 | ✅ 2026-09-12 |

## 详细日志

### 2026-09-12 AC-5.3 缺陷修复：属性面板打字 Backspace 误删元素（用户反馈）
- **原因**：EditorPage 全局 keydown 快捷键（Delete/Backspace 删除选中元素）未排除输入焦点，属性面板 input 内按键冒泡到 window 触发删除
- **TDD**：history.test.js 新增 AC-5.3 describe 两例（input 焦点内 Backspace 不删元素、shift+方向键不位移且非输入焦点删除行为保留），先红后绿；坑：±0.1 步长往返因 normalize 精度恰好回原值，红灯用例须用 shift 步长 1
- **实现**：① 快捷键抽为 `src/composables/useEditorHotkeys.js`（isTypingTarget 守卫：input/textarea/select/contentEditable + e.isComposing 中文输入法组合态）；② EditorPage 235 行超 200 上限 → 拆分后 186 行
- **验证**：209/209 全绿

### 2026-09-12 AC-10.10 语义定稿：滚轮翻页替代点击跳转（用户反馈）
- **需求**：↓ 提示恢复纯文本外观、不响应点击；页面滚动到底后继续向下滚动滚轮进入下一页（首页→作品集→项目→关于我，末页不响应）
- **实现**：① 示例 home 的 ↓ 从 link 恢复为 text（y 88），works/projects 各补一个 text ↓（y 91，about 为末页无提示）；② ShowcasePage 与 viewer-runtime 各挂 window wheel 监听：deltaY≤0 清零、400ms 手势窗口内累积 ≥160 才翻页、翻页后 1200ms 冷却（吸收触控板惯性）；runtime 用 `window.__vrWheel` 去重防多次 renderSiteInto 重复监听；未滚动到底（scrollHeight > 视口）不翻页，为将来长页预留
- **坑**：vi.useFakeTimers 断言失败时未还原会污染同文件后续用例（ZIP 用例超时），滚轮用例须 try/finally 包裹 useRealTimers；jsdom 支持 WheelEvent；jsdom scrollHeight=0 恒判定"到底"，单测可用
- **验证**：207/207 全绿；真实浏览器 mouse.wheel 链路 home→works→projects→about 全通、末页保持、↓ 无链接卡片

### 2026-09-12 AC-10.10 首页滚动提示可点击进入下一页（用户反馈：往下翻滚无作用）【已被上一条取代实现方式】
- **原因**：示例里「↓ 往下探索」是纯文本元素，无任何点击行为；且首页为单屏无下方内容，正确语义是进入下一页（作品集）
- **TDD**：AC 文档新增 AC-10.10；红灯两例（示例首页含 #/works 链接元素 + 渲染无 target；导出运行时 hash 链接无 target/不展示 url 明文，外链对照保留）→ 实现 → 205/205 转绿
- **实现**：① 示例滚动提示 text→link（url `#/works`，y 90→88 避开手机底栏）；② ElementRenderer.vue 与 viewer-runtime.js 链接分支：`#/` 开头的站内 hash 链接不带 target/rel、不显示 url 明文（当前页跳转——app 内由 vue-router 接管、导出页由 hashchange 接管），外链行为不变
- **坑**：断言选择器 `a[href="#/works"]` 会撞上导航链接（同为 #/works），需限定 `.v-link` / `.link-card` 类
- **验证**：真实浏览器点击「↓ 往下探索」→ hash `#/works` → 作品集内容渲染 ✓

### 2026-09-12 示例版式重设计（用户反馈：排版拥挤/元素错位）
- **诊断（无头 Edge 截图四页）**：所有标题被 overflow hidden 裁掉一半（盒子 h 装不下 px 字号）；内容全部挤在页面顶部 25~30%，下方 70% 空白；图片/卡片过小无视觉分量；无层级节奏
- **重设计原则（游戏官网式）**：以 1440×900 为基准（字号本就随画布宽/1440 等比缩放：编辑器 scale、展示与导出 vw，故只需重排版式坐标）；文本盒高 = 字号×1.6 行距再预留 16:9 宽屏余量；每页内容纵向铺满 100vh；统一节奏「眉题(13px) → 大标题(44/72px 粗体) → 分隔线 → 内容区块 → 底部引导」；左缘统一 8% 对齐
  - 首页：全屏居中 Hero——圆形头像(radius 50) → PORTFOLIO 眉题 → 72px 大标题 → 副标题 → 简介 → 技能标签 → 分隔线 → GitHub CTA → 底部滚动提示
  - 作品集：大幅画廊(h 38%) + 居中双外链 + 底部注脚
  - 项目：双列大图项目卡(h 30%) + 图注 + 链接 + 分隔线 + 协作引导 + 标签
  - 关于我：双段简介 + 右侧形象照(radius 8) + 双外链 + 经历时间线（首次在示例中启用 timeline 元素展示 P3 结构化能力）
- **验证**：1440×900 与 1920×1080 双视口截图八张确认无裁切、层级清晰；203/203 测试全绿（保留既有示例文案「以热爱 · 创造体验/精选作品/关于我」避免破坏 AC 测试锚点）
- **注意**：用户浏览器 localStorage 里是旧示例数据，需在编辑器画布设置中点「恢复官网式示例内容」才会看到新版式

### 2026-09-12 手动项自动化验证 + 路由 pageKey 集成缺陷修复（AC-11.3 / AC-18.4 / AC-10.2）
- **验证方法**：puppeteer-core 驱动本机 Edge 无头浏览器（临时 --no-save 安装，验证后已卸载）；vite-node 以 store 真实示例数据跑 buildMultiPageHtml 生成离线页；dev server + file:// 双通道 20 项检查
- **🔴 发现并修复 P0 起就存在的集成缺陷（AC-10.2）**：路由把 pageKey 放在 meta 但从未传给组件——`<router-view />` 不会自动传 props，ShowcasePage 的 pageKey prop 永远是默认 'home'，**真实浏览器点击导航后 URL 变化但页面内容不切换**；单测全部以 props 直挂组件所以从未暴露
  - TDD：pages-router.test.js 新增集成用例「经真实 router-view 导航后页面内容随路由切换」（先确认红灯：push('/works') 仍渲染首页内容）
  - 修复：router.js 四条展示路由增加 `props: (r) => ({ pageKey: r.meta.pageKey })`；全量 203/203 转绿
- **手机端验证结果（375×667 视口 + 移动 UA）**：首页/作品页/编辑提示页 scrollWidth=clientWidth=375、强制横滚位移 0、越界元素 0（AC-11.3 通过）；底栏 4 tab 贴底显示、点击翻页内容切换（AC-11.2）；/editor 只渲染「建议使用电脑编辑」提示（AC-11.5）；平板 800 顶部导航 + 编辑器正常、PC 1280 顶部导航（抽查通过）
- **file:// 离线验证结果（真实样例数据导出页）**：四页导航、hash 翻页高亮、未知 hash 回首页、中英实时切换 + 切回中文均通过（AC-18.3/18.4）；fetch/xhr 请求数 0（数据内联）；粒子运行时无脚本错误；无横向滚动
- **噪音项**：dev server 下 `/favicon.ico` 404（浏览器自动请求、项目无此文件，仅开发期 console 噪音，不影响验收；可后续补一个 favicon）
- **坑**：本机 5173 被其他项目占用时 vite 落到 5174，浏览器验证前先从 dev 输出确认端口；Chrome console 404 文本不含 URL，需关联 response 事件过滤；store/site.js 模块顶层访问 localStorage，node 侧跑导出需先垫 localStorage shim 再动态 import

### 2026-09-12 P4 实施完成（AC-11 三端响应式 / AC-18 导出 v2 四页路由 + 部署指引）
- **TDD 红灯先行**：新建 `tests/responsive.test.js`（BREAKPOINTS/deviceOf/adaptLayout 坐标不变 + MobileTabBar 四 tab + ShowcasePage 导航切换 + EditorPage 窄屏提示，约 10 例）；export.test.js 追加 AC-18 用例 8 个（四页 hash 路由渲染/高亮/回退/离线双语切换 + ZIP 含部署指引/粒子/相对 base/无 fetch）；确认 6 failed | 14 passed 红灯后实现
- **新纯逻辑模块** `src/core/responsive.js`：`BREAKPOINTS={MOBILE:640,TABLET:1024}`、deviceOf（<640 mobile / <1024 tablet / 否则 pc，NaN 兜底 mobile）、adaptLayout（返回浅拷贝，三端坐标 x/y/w/h 不变 AC-11.4，断点切换零数据改写）
- **新 composable** `src/composables/useDevice.js`：ref 跟踪 innerWidth + resize 监听，onMounted 注册/onBeforeUnmount 卸载
- **新组件** `src/components/MobileTabBar.vue`：fixed 底部四 tab（hash a 标签，不依赖 router 实例，当前页 .active）+ 紧凑中英切换；ShowcasePage 按 device 切换 NavTop（pc/tablet）/ MobileTabBar（mobile），resize 实时切换
- **EditorPage 窄屏闸口（AC-11.5）**：device==='mobile' 时整页只渲染 `.narrow-tip` 中文提示卡（"建议使用电脑编辑"），不挂载面板/画布；v-if/v-else 双根节点
- **viewer-runtime.js 双模式**：检测 `data.pages` 走 renderMultiSite —— 读 location.hash 决定当前页（#/、#/works、#/projects、#/about，未知/缺省回 home），hashchange 重渲染；顶部 `.v-nav-link` 导航（active 同步）+ 手机端 `.v-nav-bottom`/`.v-nav-tab`（@media 640 切换显隐）；内部 locale 状态 + `[data-lang]` 按钮实时重渲染；elHtml 全部文本字段改走 pickT（en 缺失回退 zh、字符串两语同文）；v1 扁平视图路径（含 sec-nav）完整保留；粒子经 `window.__pfStart` + PF_THEME 可选注入，缺失静默
- **导出 v2（AC-18）**：
  - `exportSite.js` 新增 `buildMultiPageHtml`：normalizePages 固定补全四页、视频逐页预解析；**双语原结构整体内联** `<script type="application/json" id="site-data">`（不再 resolveBiDeep），运行时零 fetch，file:// 可翻页切语言
  - 新 `src/export/particle-inline.js`：`particles.js?raw` 去 export 关键字 + `window.__pfStart` Canvas 绘制引导（三场景：星域连线/网格漂移/光斑渐变，随主题配色表 PF_THEME），`createParticles/stepParticles/effectiveLevel` 共源内联
  - 新 `src/export/deploy-guide.js`：ZIP 内置中文 `部署指引.html`（GitHub Pages / Vercel 分步 + 本地离线说明）
  - 共享样式抽 `baseStyle(t,h)`（v1/v2 复用）+ `multiNavStyle(t)`；含 `@media (max-width: 640px)`、body overflow-x:hidden；noscript 兜底四 hash 链接；无绝对路径资源（相对 base AC-18.3）
  - buildSiteZip 按 draft.pages 分流 v2/v1 路径；ZIP = index.html + data.json(version 2) + 部署指引.html + 部署说明.txt
- **测试**：**202/202 全绿**（16 文件，新增 18 用例）；`npm run build` EditorPage 154.74KB 独立懒加载 chunk，展示 chunk（index/ShowcasePage/useDevice）grep 无编辑器专属文案（AC-18.5）；GetDiagnostics 零问题
- **踩坑**：多页分流分支最初放在函数顶部，var FONT_STACK/lang 尚未初始化导致 `Cannot read properties of undefined`（var 提升不提升初始化）→ 分流点下移到 elHtml 定义之后；renderMultiSite 必须是函数内声明以共享 esc/elHtml/pickT 闭包，且整体仍在 renderSiteInto.toString 内保持自包含（无 import/require）

### 2026-09-12 P3 实施完成（AC-16 内容元素+美化 / AC-17 工坊四工具）
- **TDD 红灯先行**：schema.test.js 追加 AC-16.1(7)；新建 `tests/beautify.test.js`(10，AC-16.2~16.5)、`tests/editor-tools.test.js`(21，AC-17.1~17.4)；确认 3 文件红灯后实现
- **schema.js 扩展到 11 类元素**：createTimeline/createSkillMatrix/createHonors/createContactCard；createElement 新增元素级 `name/visible/locked`（图层面板用）；链接安全协议白名单 http/https/mailto（javascript: 判无效）
- **新纯逻辑模块**：
  - `core/beautify.js`：FONT_PRESETS 6 款字体预设、normalizeImageStyle（opacity/radius/shadow/grayscale/blur 钳制）、imageFilterCss、normalizeTextStyle（fontFamily/lineHeight/stroke）、fontCss、elementAnimate
  - `core/align.js`：findAlignGuides（边缘/中心/画布中心 50，阈值 1.5%，等距时边缘优先）、applyGuides
  - `core/multiselect.js`：rectsIntersect/boxSelect（隐藏元素不参与）/shiftToggle/moveMany（钳制 0~100）/alignElements（6 向对齐）
  - `core/templates.js`：8 组区块模板（hero/worksGrid/projectCase/timeline/skillMatrix/honors/contact/aboutProfile），instantiateTemplate 每次重跑工厂重生 id，未知 key 抛中文错误
- **store/site.js 新增**：selectedIds 多选集合；toggleSelection/clearSelection/setBoxSelection/removeSelected/dragSelectedTo/alignSelected；toggleVisible/toggleLocked/renameElement；insertTemplate；add/duplicate/remove 同步多选；resetSite 清多选
- **新组件**：StructuredElements（四类元素渲染）、BeautifyPanel（图片/文本美化+动效开关）、StructuredProps（条目增删改）、LayerPanel（列表/选中/显隐/锁定/改名/层级）、TemplateLibrary、MultiSelectBar（批量对齐/删除）、CanvasSettings（吸附/对齐线开关抽出）；PropsPanel 从 EditorPage 抽出全部属性编辑；EditorPage 重写后 198 行
- **拖拽重构**：抽 `composables/useStageDrag.js`（单/多选拖拽 + 对齐吸附 + 框选 marquee + 锁定禁拖）；CanvasStage 增 selectedIds/alignGuides props 与 move-many/boxselect 事件，隐藏元素编辑态半透明幽灵、展示态不渲染
- **入场动效（AC-16.4）**：ElementRenderer `.el-enter` 类，元素 props.animate!==false 且非 quiet 档启用
- **导出一致（AC-16.5）**：viewer-runtime.js 增加四类元素 HTML、FONT_STACK 字体映射、图片滤镜/圆角/阴影、文本行高/描边、v-no-anim；导出过滤 visible===false；exportSite.js 补全套 .v-tl/.v-sm/.v-hon/.v-cc CSS
- **测试**：**184/184 全绿**（15 文件，新增 38 用例）；构建 EditorPage 140KB 独立懒加载 chunk，展示 chunk 无编辑器面板代码（useStageDrag 随共享 CanvasStage 打入共享 chunk，沿用 P0 既有架构）
- **踩坑**：对齐线等距吸附需固定 tie-break（按 left→center→right 严格小于比较，保证边缘优先）；多选拖拽必须以锚点当前绝对坐标反推增量，避免逐帧增量漂移；PropsPanel 迁移时漏 placeholder 导致 i18n 旧测试选择器落空

### 2026-09-10 P2 实施完成（五套主题 + 粒子引擎 + 三档动效）
- **TDD 红灯先行**：新增 `tests/particles.test.js`(11) + 更新 `theme.test.js`(AC-14.1~14.3) + `pages.test.js`(主题名/背景层类名)；确认红灯后实现
- **新纯逻辑模块** `src/core/particles.js`：
  - `PARTICLE_SCENES = ['starfield', 'gridDrift', 'lightOrb']`（AC-15.1 三场景）
  - `MOTION_LEVELS = ['quiet', 'standard', 'rich']`（AC-15.2 三档）
  - `createParticles(scene, level, w, h)`：starfield 有 linkRadius、gridDrift 有 cellX/cellY、lightOrb 有 phase
  - `stepParticles(particles, scene, level, dt, w, h)`：位置更新 + 边界回绕 + 光斑脉动
  - `effectiveLevel(level, ua)`：移动端 UA 自动降级为 quiet（AC-15.3）
  - `shouldReduceMotion()`：prefers-reduced-motion 检测（AC-15.5）
- **theme.js 扩展到 5 套**（AC-14.1）：business（曜蓝商务）/ glass（星穹玻璃拟态）/ neon（暗夜霓虹）/ morning（极简晨白）/ pixel（复古像素）；每套含 `particleScene` + `motionPreset` 字段（AC-14.2）
- **TechBackdrop.vue 重写**：CSS 静态层 → Canvas 2D 粒子引擎 + CSS 网格/暗角；接收 `themeId` / `motionLevel` props；页面不可见暂停（AC-15.3）；节能档不渲染粒子
- **CanvasStage.vue**：新增 `motionLevel` prop 传递给 TechBackdrop
- **store/site.js**：新增 `setMotion(level)` 持久化动效档位（AC-15.2）
- **EditorPage.vue**：主题下拉 5 选项 + 动效档位选择器
- **测试**：**146/146 全绿**（13 文件，新增 11 用例）；构建分包：EditorPage 125KB 独立 chunk
- **踩坑**：Vue SFC 不支持 `obj?.prop = val` 可选链赋值语法 → 改用独立 cleanupFn 变量；pages.test.js 旧类名 `.tb-net`/`.tb-vignette` 需更新为 `.tb-canvas`/`.tb-vig`

### 2026-09-10 P1 实施完成（双态发布/快照/还原）
- **TDD 红灯先行**：新增 `tests/snapshots.test.js`(9) + `tests/publish.test.js`(13) + storage.test.js 补 AC-13.1(2)；确认 3 文件失败红灯后实现
- **新纯逻辑模块** `src/core/snapshots.js`：
  - `MAX_SNAPSHOTS=20`、`createSnapshot(published, note)`（id+time+note+data 深拷贝）
  - `pushSnapshot(list, snap)`（FIFO 上限 20，不修改原数组）
  - `normalizeSnapshots(list)`（过滤无 id 项、补全 data/note）
  - `snapshotById(list, id)`
- **store 改造** `src/store/site.js`：
  - `publishDraft(note)`：草稿覆盖 published + 生成快照压栈
  - `restoreSnapshot(id)`：快照 data 写入 draft（不覆盖 published）+ lastPushed=null 强制压栈可撤销
  - `revertDraft()`：放弃草稿回到 published + 可撤销
  - `hasUnpublishedChanges()`：draft vs published 比对
  - `resetSite()`：测试间重置（不破坏 initSite 的非重置语义）
  - 全部操作改为**操作后 pushHistory**（addElement/removeElement/duplicate/setTheme/setPageHeight/moveElementLayer/resetToSample/importSiteJson），修正 undo 语义
  - `history.js` 新增 `reset()` 方法
- **UI 层** `src/components/PublishPanel.vue`：
  - 发布确认弹层（备注输入 + AC-13.4 二次确认）
  - 还原二次确认弹层
  - 快照列表面板（预览 + 一键回滚）
  - 未发布改动徽章（warn/ok）
- **storage.js 接入**：`normalizeSnapshots` 用于 serialize 和 importSiteJson
- **测试**：**134/134 全绿**（12 文件，新增 24 用例）；构建分包验证：EditorPage 124KB 独立懒加载 chunk
- **踩坑**：pushHistory 操作前压栈导致 undo 回到上上个状态 → 改为操作后压栈；initSite 重置 draft 破坏 i18n 组件测试 → 拆分 resetSite；hasUnpublishedChanges 用 computed 导出但测试按函数调用 → 改为普通函数

### 2026-09-10 P0 实施完成（数据契约 v2 + 四页路由 + 双语）
- **TDD 红灯先行**：先写 `tests/i18n.test.js`(14) / `pages-router.test.js`(11) / `migrate.test.js`(8) 三新文件 + 更新 `storage.test.js` / `export.test.js` / `theme.test.js`；确认 9 failed / 61 passed 红灯后再实现
- **新纯逻辑模块**：
  - `src/core/i18n.js`：`toBi / pickText / resolveBiDeep / LANGS`（双语字段归一化、取值回退、深层解析），纯逻辑无 Vue 依赖
  - `src/core/pages.js`：`PAGE_KEYS / DEFAULT_PAGE_NAMES / normalizePages / pageAt / flattenPages`（四页模型 + 多页合成单画布视图）
  - `src/core/migrate.js`：`migrateV1toV2`（v1 分区切页、坐标 y/h 换算、文本字段双语化、主题沿用非法回退、draft=published）
  - `src/core/storage.js` 重写为 v2 契约：`DATA_VERSION=2`、根字段 `locale/motion/published/draft/snapshots`、`V1_BACKUP_KEY` 迁移前备份
- **UI 层**：
  - `src/components/NavTop.vue`（AC-10.3/12.2）：四页链接 + 中英切换，hash 链接 + props.pageKey 高亮（测试直挂无 router 依赖）
  - `src/pages/showcase/ShowcasePage.vue`：展示页共用组件，props.pageKey 决定渲染哪一页，数据取 `site.published`
  - `src/components/EditorActions.vue`：拆分编辑器操作区以控制 EditorPage 行数 ≤400
  - `src/pages/EditorPage.vue` 重写：页签切换、双语输入（content/title/caption）、v2 store 绑定、`publishDraft()` 按钮
  - `src/store/site.js` 重写：双态 `draft/published` + 跨页查找元素 + `setLocale/setCurrentPage/publishDraft` + 示例内容四页双语化
  - `src/router.js`：四展示路由 + meta.pageKey + 兜底重定向（AC-10.1/10.9）
  - `src/components/ElementRenderer.vue`：接入 `pickText` 双语渲染（text/link/gallery.caption/image.alt）
  - `src/core/exportSite.js`：`buildStandaloneHtml` 接收 v1 视图（由 `flattenPages` 合成）；`buildSiteZip` 适配 v2 输入并 `resolveBiDeep` 按当前语言解析
  - `src/core/resume.js`：兼容 v1 视图与 v2 契约输入，双语字段按 locale 取值
- **清理**：删除 `DisplayPage.vue` / `SectionNav.vue` / `core/sections.js`（v1 分区分页已被多页路由取代）
- **测试**：**110/110 全绿**（10 文件）；构建分包验证：EditorPage 独立 122KB 懒加载 chunk，展示 chunk 无编辑器实现代码（AC-1.3）
- **踩坑**：展示路由组件若静态 import 则 `matched[0].components.default` 不是函数，测试要求懒加载 → 全部改动态 import；NavTop 不能依赖 useRoute/RouterLink（测试直挂无 router 插件）→ 改 hash a 标签 + props 高亮

### 2026-09-10 v2.0 需求升版（五轮事件风暴）
- 用户 11 项新需求 → 五轮选择题事件风暴（17 决策点）全收敛：多页路由站 / 保留画布引擎加页面维度 / 关于我四板块 / 中英双语 / 混合式三端（手机底部标签栏）/ 工坊仅 PC / hash 路由 / 双态+快照 / 一键 ZIP+指引 / 进阶美化 / 工坊四增强全选 / 大跨度五主题 / Canvas 2D 自研粒子 / 三档动效 / 影视×AI 双线采样 / 外链为主素材 / 双平台兼容 / AC 升版 v2.0
- 产出：`docs/acceptance-criteria.md` v2.0（新增 AC-10~19；废弃 AC-4.1、AC-9.1~9.6；附录 A 12 个参考站点）、`docs/technical-design.md` v2.0、memory-bank 三文件同步
- 里程碑 P0~P4 见技术文档第 13 节；下一步 = 用户确认后启动 P0（TDD 红灯先行）

### 2026-09-03（第五批）科技氛围背景层
- 用户新增需求："背景单调，加科技感图片或线条增加层次"
- 新增 **AC-4.5**：科技氛围背景层（细网格 + 星座节点连线 + 每屏暗角），三层（展示/编辑预览/导出）一致
- 实现：`src/components/TechBackdrop.vue` 纯 CSS 三分层 ——
  - 细网格 72px + 14s 呼吸动画
  - 星座连线 SVG data-URI（节点青色点缀），`background-size: 100% 100vh` + repeat-y 每屏一组，90s 缓慢上漂
  - 每屏暗角收拢视线
- 导出页运行时注入同结构 `.v-tech`（vt-grid/vt-net/vt-vig + 同款动画），filter 掉非 .v-el 节点避免背景层被观察
- 测试 **80/80 全绿**（pages +2、export +1）；构建正常
- 教训：dev 服务器后台进程会被回收（用户侧表现为"服务不可用"），重启即可；WebView 截图通道持续超时，视觉验收依赖用户浏览器
- 待办：浏览器视觉走查（四屏 + 分页导航 + 背景层）、移动端验收（AC-2.8/9.4）

### 2026-09-03（第四批）分区分页导航 + 版式定稿
- 新增 **AC-9**（6 条）：sections 数据契约 / 分页组件 / 滚动高亮 / 响应式 / 导出同步 / 示例图文定稿
- **纯逻辑**：`src/core/sections.js`（normalizeSections / sectionIndexAt / clampIndex），tests/sections.test.js 5 例
  - 踩坑：`Number(0) || 100` 把合法起点 y=0 当缺省 → 改用 Number.isFinite 显式判断；边界容差 0.5 过宽致提前切页 → 收紧至 0.01
- **数据契约**：serialize/deserialize 增加 `sections: [{name, y}]`（默认 []），store 快照/恢复/导入/示例重置全同步
- **UI**：`SectionNav.vue` 固定右侧（页码+分区名、←→ 翻页、点击平滑跳转），≤640px 紧凑；`DisplayPage` 滚动进度换算画布百分比高亮当前分区
- **导出页**：viewer-runtime 内嵌同款分页导航（保持自包含无 import）
- **示例定稿（AC-9.6）**：pageHeight=400 四屏（首页/作品/案例/项目，y=0/25/50/75）；5 张 trae 图源示例图、相册、两个图文项目卡、6 个外链卡、B站视频；版式不再调整，后续仅替换内容
- 测试 **77/77 全绿**；构建：展示侧 DisplayPage 2.28kB + site 14.33kB + index 95.45kB，编辑器 118.56kB 独立分包
- 待办：浏览器视觉走查（WebView 超时未截图）、移动端验收（AC-2.8/9.4）

### 2026-09-03（第三批）「去简历化」官网式改版
- 用户反馈：简历味太浓，要求对照网易/米哈游等大厂官网整改
- **纵向叙事**：示例重构为 Hero（光斑氛围 + "以热爱 · 创造体验"大字口号 + 往下探索提示）→ 精选作品（相册 + B站视频 + 链接卡）→ 联系区，`pageHeight=260`（vh）
- **滚动进场动画**：CanvasStage 增加 IntersectionObserver 滚动点亮（`.in` class + transition-delay 错峰），仅展示/导出态启用；jsdom 无 IO 时兜底全显
- **导出页同步**（exportSite.js + viewer-runtime.js）：pageHeight 注入 vh 高度、主题渐变背景、v-in 进场、玻璃拟态链接卡/标签、文本对齐/字重/装饰 blur 与编辑器渲染对齐
- **数据契约**：`serialize` 增加 `pageHeight`（默认 100，钳制 100~500）
- **编辑器**：页面总高输入、文本对齐/字重选择、「恢复官网式示例内容」按钮（旧 localStorage 示例会盖住新模板，一键覆盖且可撤销）
- 测试 **68/68 全绿**；构建分包验证通过（编辑器 chunk 116kB 含 jszip，展示侧无编辑器代码）
- **踩坑**：viewer-runtime 的 elHtml 用到 index 参数但函数签名漏声明 → ReferenceError，测试捕获
- 待办：浏览器视觉确认（WebView 本轮持续超时）、移动端验收（AC-2.8）

### 2026-09-03（第二批）导出能力完成
- **静态站导出（AC-6.5）**：`src/core/exportSite.js` + `src/export/viewer-runtime.js`
  - 独立 index.html：内联主题 CSS + 嵌入数据（`<` 转义防截断）+ 无框架运行时（`Function.toString` 内联）
  - 视频外链导出时预解析为嵌入地址；ZIP 含 index.html / data.json / 部署说明.txt
  - 浏览器端到端实测：导出页在 vite preview 下完整渲染玻璃拟态主题 ✓
- **A4 PDF 简历（AC-6.6）**：`src/core/resume.js`，从画布抽取姓名（最大字号文本）/简介/技能/链接/作品缩略图，`@page A4` + 自动打印脚本
- **属性面板**：新增位置/尺寸数值输入（X/Y/宽/高，百分比，带边界钳制）
- **编辑器实测**：1:3 布局、主题切换即时生效均通过浏览器截图验收
- 测试 **65/65 全绿**（新增 export.test.js 10 例）；jszip 仅进编辑器分包（113.89kB），展示页产物不受影响
- 清理了临时验证脚本与产物

### 2026-09-03 阶段 2 + 3 + 4（骨架级）完成
- 核心模块全部实现，测试 **55/55 全绿**（新增 pages.test.js 组件冒烟 4 例）
- Vue 骨架：hash 路由（`#/` 展示页、`#/editor` 编辑器页懒加载分包 7.48kB，AC-1.3 构建验证通过）
- 编辑器：1:3 布局、七类元素添加、属性面板、图层调整、主题切换、网格吸附开关、撤销/重做、快捷键（Delete/方向键/Ctrl+D/Ctrl+Z）、JSON 导入导出
- 展示页：浏览器实测渲染正常（头像/简介/技能标签/相册/B站视频嵌入/链接卡片）
- **踩坑记录**：
  1. 工厂函数曾把 x/y/w/h 留在 props 导致元素全部叠在原点 → createElement 现将定位字段提升到元素层级
  2. store 曾漏导入 createVideo 导致路由启动报错
  3. 历史栈用例与纯数据结构语义曾不一致 → 应用层以「预压初始快照」满足首个操作可撤销
  4. 浏览器 WebView 长时间空闲会被节流，截图/快照超时 → 以组件测试替代
- 待办：属性面板打磨（位置数值输入、对齐工具）、静态站 ZIP 导出、A4 PDF 简历、移动端展示验收（AC-2.8）

### 2026-09-02 阶段 0 + 1 完成
- 事件风暴三轮定稿：自由画布 / 自适应流式 / 独立编辑器页 / 七类元素 / 三主题 / 撤销重做+网格吸附+快捷键 / 三种导出 / 预填示例
- 产出：
  - `docs/acceptance-criteria.md`（AC-1 ~ AC-8，共 42 条）
  - `tests/`：schema(19) / canvas(11) / history(5) / storage(11) / theme(6) 用例
  - `src/core/`：5 个桩模块
  - `AGENTS.md`、`memory-bank/` 六件套
- 测试基线：**51 用例，1 通过 50 失败**（红阶段）
- 依赖已安装（vue / vite / vitest / jsdom）

## 已知问题
- （暂无）
