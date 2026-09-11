# 个人作品集网站 · 技术设计文档

> 版本：v2.0 ｜ 日期：2026-09-10 ｜ 需求基准：[acceptance-criteria.md](./acceptance-criteria.md) v2.0
> 技术栈不变：Vite + Vue 3（Composition API + `<script setup>`）+ Vitest（TDD），零后端，零新增运行时依赖。

---

## 1. 现有资产复用清单

| 资产 | 位置 | v2.0 处置 |
|---|---|---|
| hash 路由（vue-router 4） | `src/router.js` | 扩展：新增 `#/works`、`#/projects`、`#/about` 三条展示路由 |
| 自由画布渲染 | `src/components/CanvasStage.vue` + `ElementRenderer.vue` | 保持复用（AC-7.2），扩展渲染新元素类型与美化属性 |
| 纯逻辑层 | `src/core/schema.js / canvas.js / history.js / theme.js / storage.js / sections.js` | 保留；`sections.js` 随 AC-9 废弃转为迁移工具 |
| 编辑器 | `src/pages/EditorPage.vue`（25/75 分栏） | 保持布局，左面板 Tab 化扩展 |
| 自包含导出运行时 | `src/export/viewer-runtime.js` + `src/core/exportSite.js` | 扩展：路由/粒子/双语内联 |
| 科技背景层 | `src/components/TechBackdrop.vue` | 由粒子引擎（AC-15）承接升级 |

---

## 2. 目标架构

```mermaid
graph TD
  subgraph 展示站（公开产物，无编辑器代码）
    R[hash 路由 router.js] --> P1[首页 #/]
    R --> P2[作品集 #/works]
    R --> P3[项目 #/projects]
    R --> P4[关于我 #/about]
    P1 & P2 & P3 & P4 --> ST[CanvasStage 渲染层]
    ST --> TH[theme.js 五套主题 CSS 变量]
    ST --> PF[ParticleField 粒子层]
    ST --> IG[i18n.js 双语取值]
  end
  subgraph 工坊（仅 PC，懒加载分包）
    E[EditorPage 25/75] --> ST
    E --> ED[store/site.js 草稿态]
    ED --> PB[发布 / 快照 / 还原]
    ED --> EX[exportSite.js 一键 ZIP]
  end
  LS[(localStorage<br/>portfolio-site-data v2)] --- E
  LS --- R
```

**目录结构增量**（遵循「单文件 ≤400 行、组件 ≤200 行」）：

```
src/
├── core/                    # 纯逻辑层（禁止 Vue 依赖，可单测）
│   ├── pages.js             # 新增：页面模型归一化 / 路由 key 映射 / 默认四页
│   ├── i18n.js              # 新增：双语字段取值与回退
│   ├── particles.js         # 新增：粒子场景纯逻辑（状态步进，确定性 seed）
│   ├── align.js             # 新增：智能对齐线计算
│   ├── templates.js         # 新增：区块模板库（≥8 组 JSON 模板）
│   ├── motion.js            # 新增：动效三档参数表 + 降级判定
│   └── migrate.js           # 新增：v1 → v2 数据迁移
├── components/
│   ├── ParticleField.vue    # 新增：canvas 2D 粒子渲染（rAF 单例、可见性暂停）
│   ├── NavTop.vue           # 新增：桌面/平板顶部导航
│   ├── TabBar.vue           # 新增：手机端底部标签栏
│   ├── panels/              # 编辑器左面板拆分（每文件 ≤200 行）
│   │   ├── LayerPanel.vue / PropertyPanel.vue / BeautifyPanel.vue
│   │   ├── TemplatePanel.vue / PagePanel.vue / SnapshotPanel.vue
├── pages/
│   └── showcase/            # 四个展示页（薄壳，复用 CanvasStage）
│       ├── HomePage.vue / WorksPage.vue / ProjectsPage.vue / AboutPage.vue
```

---

## 3. 数据契约 v2（localStorage 键名不变）

`src/core/storage.js`：`DATA_VERSION = 2`，序列化根结构：

```json
{
  "version": 2,
  "locale": "zh",
  "motion": { "level": "standard" },
  "published": {
    "theme": "midnightBlue",
    "pages": [
      {
        "key": "home",
        "name": { "zh": "首页", "en": "Home" },
        "pageHeight": 200,
        "elements": [
          {
            "id": "el_xxx", "type": "text", "x": 10, "y": 6, "w": 40, "h": 10, "z": 1,
            "props": {
              "text": { "zh": "你好，世界", "en": "Hello World" },
              "beautify": { "opacity": 1, "radius": 12, "shadow": "md", "filter": "none",
                            "font": "sans-cn", "weight": 600, "lineHeight": 1.6,
                            "align": "left", "stroke": null, "enterFx": true }
            }
          }
        ]
      }
    ]
  },
  "draft": { "…与 published 结构完全一致…" },
  "snapshots": [
    { "id": "snap_xxx", "ts": 1760000000000, "note": "第 1 次发布", "data": { "theme": "…", "pages": "…" } }
  ]
}
```

要点：

| 决策 | 说明 |
|---|---|
| 双态 | `draft` 编辑实时写入；`published` 展示页只读源（AC-13.1）。历史 v1 用户无感：无发布动作前展示旧数据 |
| 快照 | 上限 20 个 FIFO；只存 `published` 拷贝（含 theme/pages），防膨胀（AC-13.2/13.3） |
| 双语 | 文本类字段值允许三种形态：`string`（双语言同文）/ `{zh, en}`；取值统一走 `i18n.js` |
| 美化 | `props.beautify` 统一挂载，元素渲染层拼 CSS；缺省走主题默认（AC-16） |
| 坐标 | 沿用百分比 0~100（AC-2.1 不变）；`pageHeight` 下沉到页级（100~500） |

**v1 → v2 迁移规则（`core/migrate.js`，`deserialize` 自动触发，AC-6.4）**：

1. `elements` 按 v1 `sections`（0/25/50/75 → home/works/projects/about）切分归页；无 sections 时全部归入 `home`
2. 主题映射：`business → midnightBlue`、`glass → glass`、`pixel → pixel`
3. 文本 `string` → `{ zh: 原文, en: "" }`
4. `draft = published = 迁移结果`、`snapshots = []`、`locale = "zh"`、`motion.level = "standard"`
5. 缺 `version` / JSON 非法仍报中文错误（行为不变）

---

## 4. 路由与页面模型

- `router.js`：展示路由 `/` → `HomePage`、`/works`、`/projects`、`/about`（全部懒加载）；兜底 `/:pathMatch(.*)*` → redirect `/`（AC-10.9）；`/editor` 独立分包不变
- `core/pages.js`：`normalizePages(data)`（key 缺省/去重/补默认四页）、`PAGE_KEYS = ["home","works","projects","about"]`
- 每页独立滚动容器 + 页级 `pageHeight`；切换页面恢复各自滚动位置（sessionStorage 记录）

## 5. 多端响应式（AC-11）

| 层 | 方案 |
|---|---|
| 断点 | `<640` 手机 / `640~1023` 平板 / `≥1024` PC；JS 侧 `useBreakpoint()`（matchMedia），CSS 侧 media query |
| 内容 | 百分比坐标流式缩放不变；字号/间距用 `clamp()` 流体排版 |
| 导航 | PC/平板 `NavTop.vue`；手机 `TabBar.vue` 固定底部（安全区 `env(safe-area-inset-bottom)`） |
| 工坊 | `isDesktop === false` 时渲染「建议使用电脑编辑」提示（AC-11.5），编辑面板不挂载 |

## 6. 双语方案（AC-12）

- `core/i18n.js`：`pickText(value, lang)` —— `string` 原样返回；`{zh,en}` 按 lang 取值、空值回退 `zh`、再空回退 `""`
- 站点语言由数据 `locale` 驱动；展示页切换按钮写入并持久化（AC-12.2）
- 编辑器属性面板：文本类字段渲染中/英双输入框（zh 必填，en 可空）
- 编辑器界面文案维持中文常量表，不引 vue-i18n

## 7. 主题系统 v2（AC-14）

| key | 名称 | 基调 | 粒子场景预设 | 动效档位预设 |
|---|---|---|---|---|
| `midnightBlue` | 曜蓝商务 | 科技商务主线（business 升级，暗色） | 星域连线 | 标准 |
| `glass` | 星穹玻璃拟态 | 玻璃卡片 + 光晕（暗色） | 光斑浮动 | 沉浸 |
| `neon` | 暗夜霓虹 | 赛博霓虹描边（暗色） | 网格漂移 | 沉浸 |
| `dawn` | 极简晨白 | 浅色极简 | 光斑浮动（低密度） | 标准 |
| `pixel` | 复古像素 | 像素游戏 | 网格漂移（低密度） | 标准 |

- `theme.js`：五套完整 CSS 变量集（AC-4.2 字段超集：背景/前景/主色/圆角/阴影/字体 + 粒子密度/发光强度），主题快照测试防字段缺失
- 全局切换器位于展示页右上角（语言切换旁），写入草稿并即时预览，发布后生效到展示页

## 8. 粒子引擎（AC-15）

- `core/particles.js`（纯逻辑，可单测）：`createField(scene, opts)` → `{ step(dt), particles, links }`；确定性伪随机（seed），三种场景：`starfield` 星域连线 / `gridDrift` 网格漂移 / `glow` 光斑浮动
- `ParticleField.vue`：单例 rAF、DPR ≤ 2、`visibilitychange` 暂停、`prefers-reduced-motion` 强制节能、帧率采样 < 30fps 持续 2s 自动降档（AC-15.3/15.5）
- 三档参数表（`core/motion.js`）：沉浸（全量粒子 + 滚动叙事 + 微交互）/ 标准（背景粒子 + 关键微交互）/ 节能（静态背景）
- 三层一致：`CanvasStage` / 编辑器预览 / `viewer-runtime` 内联同一份逻辑（AC-15.4，沿用导出自包含决策）

## 9. 工坊 v2（AC-13 / AC-16 / AC-17）

- 布局保持 25/75（AC-1.1）；左面板 Tab 化：`页面 | 图层 | 属性 | 美化 | 模板 | 快照`
- 双态 store（`store/site.js` 扩展）：`draft / published / snapshots / locale / motion`；`publish()` = draft 覆盖 published + 快照入列；`restore()` = 丢弃 draft（有未发布改动时 UI 二次确认）
- `core/align.js`：`computeGuides(movingBox, others, canvas, thresholdPx)` → 吸附修正 + 参考线列表（纯函数单测）
- `core/templates.js`：≥8 组模板 JSON（英雄区 / 作品网格 / 时间线 / 技能矩阵 / 荣誉墙 / 联系区 / 项目卡 / 数据亮点）；插入时批量重生成 id 并归位画布（AC-17.3）
- 多选：`selection: string[]`；批量操作纯函数 `batchMove / batchAlign / batchLayer / batchDelete`
- 快捷键沿用 AC-5，新增 `Ctrl+S` 发布、`Ctrl+Shift+S` 另存快照备注

## 10. 导出管线 v2（AC-18）

- `viewer-runtime.js` 扩展（保持自包含，禁止外部引用）：
  - 内联微型 hash 路由（~40 行，与 vue-router 行为对齐：四页切换 + 兜底回首页）
  - 内联粒子步进 + i18n 取值 + 五主题 CSS 变量（与 `src/core` 共源，构建时经 `Function.toString` 注入）
- ZIP 结构：`index.html`（自包含入口）/ `data.js`（站点数据）/ `部署指引.html`（GitHub Pages + Vercel 分步说明）/ `assets/`
- 导出前容量预检：序列化体积 > 4MB 时中文提示「建议将大图改为外链」（localStorage 风险对策）
- 双平台兼容：hash 路由 + 相对 base + 内联数据，`file://` 离线可用（AC-18.3/18.4）

## 11. 依赖与体积预算

| 依赖 | 用途 | 范围 |
|---|---|---|
| vue ^3.4 / vue-router ^4 | 已有 | 展示 + 编辑器 |
| jszip ^3.10 | 已有 | 仅编辑器 chunk（懒加载） |
| 新增运行时依赖 | — | **0** |

- 展示首屏 JS ≤ 150KB gzip；编辑器独立 chunk；粒子关闭时零运行成本
- 图片 `loading="lazy"` + `decoding="async"`；粒子画布离屏即暂停

## 12. 风险与对策

| 风险 | 等级 | 对策 |
|---|---|---|
| 导出运行时复杂度膨胀（路由+粒子+双语内联） | 高 | 与 `src/core` 共源 + 导出冒烟测试（pages/export.test.js） |
| localStorage 约 5MB 上限（快照+双语放大） | 高 | 外链为主素材策略 + 快照上限 20 + 导出前容量预检 |
| 五主题 × 三档 × 四页组合矩阵测试成本 | 中 | 主题字段快照测试 + 粒子纯逻辑单测 + 手动走查只跑代表组合 |
| `file://` 下路由/双语失效 | 中 | hash + 数据内联 + `data.js`，禁止 fetch |
| 移动端粒子性能 | 中 | 三档降级 + 帧率采样自动降档 + `prefers-reduced-motion` |
| v1→v2 迁移丢数据 | 中 | `migrate.js` 单测全覆盖 + 迁移前自动备份原始 v1 JSON 至独立键 |

## 13. 实施里程碑（TDD：AC → 测试红 → 实现绿）

| 阶段 | 内容 | 对应 AC | 测试文件 |
|---|---|---|---|
| P0 | 数据契约 v2 + 迁移、四页路由与页面模型、双语取值 | AC-10、AC-12、AC-6 | pages-router / i18n / storage |
| P1 | 双态发布 + 快照 + 还原 | AC-13 | publish / storage |
| P2 | 五套主题 + 粒子引擎 + 三档动效 | AC-14、AC-15 | theme / particles |
| P3 | 四类内容元素 + 美化 + 工坊工具 | AC-16、AC-17 | schema / beautify / editor-tools |
| P4 | 三端响应式收口 + 导出 v2 + 部署验收 | AC-11、AC-18、AC-19 | responsive / export |

每阶段完成：`npm run test` 全绿 → `npm run build` 分包检查 → 同步 `memory-bank/progress.md` 与 `activeContext.md`。
