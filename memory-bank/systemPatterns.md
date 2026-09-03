# 系统模式（System Patterns）

## 总体架构

```
┌─ Vite + Vue 3 SPA ──────────────────────────────┐
│                                                  │
│  /editor（懒加载独立 chunk）      /（展示页）      │
│  ┌──────────┬──────────────┐   ┌──────────────┐ │
│  │ 编辑面板  │   预览画布    │   │  只读渲染     │ │
│  │  (25%)   │    (75%)     │   │  移动端自适应  │ │
│  └──────────┴──────────────┘   └──────────────┘ │
│         │                            │           │
│         └──────────┬─────────────────┘           │
│                    ▼                             │
│        共用渲染组件（编辑预览 = 展示渲染）           │
├──────────────────────────────────────────────────┤
│  src/core 纯逻辑层                                │
│  schema / canvas / history / theme / storage     │
│                    ▼                             │
│  JSON 数据 ⇄ localStorage（键：portfolio-site-data）│
└──────────────────────────────────────────────────┘
```

## 关键模式

### 1. 数据驱动渲染
单一数据源 `site = { version, elements[], theme }`。编辑器所有操作都是「改数据」→ Vue 响应式自动刷新预览；展示页只是同一份数据的只读渲染（复用渲染组件，AC-7.2）。

### 2. 百分比坐标体系（AC-2.1/2.2）
- 存储：元素 `x/y/w/h` 均为 0~100 的百分比
- 渲染：`percentToPx(p, base)` 换算为像素，基准取当前画布尺寸 → 天然响应式
- 编辑：拖拽时 `pxToPercent` 回写，配 `snapToGrid` 吸附

### 3. 元素工厂 + 校验（AC-3.x）
`createElement(type, overrides)` 统一生成（id/坐标/层级默认值），七类元素各有具名工厂；`validateElement` 把关所有输入。新增元素类型时：改 schema → 测试 → 渲染组件。

### 4. 历史栈（AC-5.x）
`createHistory()` 维护 states + pointer，push 截断重做分支，上限 50。编辑器每次原子操作前 push 快照。

### 5. 主题系统（AC-4.x）
三套主题定义为 CSS 变量集合（background/foreground/primary/radius/shadow/font），`applyTheme` 写入 `:root`，组件只消费变量。主题 id 是站点数据的一部分，随导入导出走。

### 6. 导入导出与安全
- 序列化带 `version` 字段；反序列化严格校验，失败抛中文错误且**不动现有数据**
- 视频外链经 `toEmbedUrl` 白名单解析（B站/YouTube），不识别即拒绝

### 7. 分包隔离（AC-1.3）
editor 路由动态 `import()`，展示页静态产物不含编辑器代码；构建后需检查 chunk 分离。

## 待补模式（实现阶段）
- 拖拽交互（pointer events + 命中检测）
- 素材上传（FileReader → dataURL）
- ZIP 打包导出（JSZip）、PDF 生成（模板渲染 + 打印分页）
