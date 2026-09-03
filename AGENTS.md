# AGENTS.md — 个人作品集网站开发指南

> 本文件供 AI 编码代理与新成员阅读。开始任何工作前请先通读本文与 `docs/acceptance-criteria.md`。

## 项目概述

无后端的**个人作品集网站**（替代简历）：自由画布编辑器 + 公开展示站。
- **编辑器**（`/editor`）：左侧编辑面板 25% + 右侧实时预览 75%，独立路由，仅本地使用
- **展示页**（`/`）：纯静态、公开访问、移动端流式自适应，不暴露编辑器代码
- **数据**：JSON（元素按百分比坐标存储）↔ localStorage；支持导出静态站 ZIP / A4 PDF 简历 / JSON 备份

## 常用命令

```bash
npm install        # 安装依赖
npm run dev        # 本地开发服务器
npm run test       # 运行全部测试（vitest run）
npm run test:watch # 监听模式
npm run build      # 构建静态产物
```

## 开发流程（强制 TDD）

本项目采用**测试先行**：验收标准（AC）→ 测试用例 → 实现。

1. 需求变更时，先更新 `docs/acceptance-criteria.md`（新增/修改 AC 编号）
2. 再更新/新增 `tests/*.test.js` 中对应用例（describe 标题必须含 AC 编号）
3. 运行 `npm test` 确认新用例红灯
4. 实现 `src/` 代码使其转绿
5. **禁止**：先写实现再补测试；跳过失败的测试（`skip`/`only`）需用户明确批准

当前状态：**红阶段** —— 测试与桩模块已就绪，`src/core/*` 全部待实现。

## 目录结构

```
e:\TRAE
├── docs/
│   └── acceptance-criteria.md   # 验收标准（唯一需求基准）
├── memory-bank/                  # 项目记忆库（见下）
├── tests/                        # 测试文件（文件名 = 被测模块名）
│   ├── schema.test.js            # AC-3.x  元素模型
│   ├── canvas.test.js            # AC-2.x  画布坐标/图层
│   ├── history.test.js           # AC-5.x  撤销重做
│   ├── theme.test.js             # AC-4.x  主题系统
│   └── storage.test.js           # AC-6.x / AC-8.1 持久化/导入导出
├── src/
│   └── core/                     # 纯逻辑层（当前为 TDD 桩）
│       ├── schema.js             # 七类元素工厂 + 校验
│       ├── canvas.js             # 坐标互转/网格吸附/图层
│       ├── history.js            # 历史栈（上限50）
│       ├── theme.js              # 三套主题（business/glass/pixel）
│       └── storage.js            # 序列化/localStorage/导入导出/视频嵌入解析
├── AGENTS.md                     # 本文件
├── package.json
└── vitest.config.js              # jsdom 环境
```

## 核心约定

### 代码规范
- **语言**：界面、注释、错误消息一律**中文**
- 技术栈：Vite + Vue 3（Composition API + `<script setup>`），不引入 UI 组件库
- `src/core/` 保持**纯逻辑**（无 Vue 依赖、无 DOM 副作用，`theme.js`/`storage.js` 的 DOM/ls 访问除外），保证可单测
- 元素坐标/尺寸统一**百分比 0~100** 存储展示，像素仅在渲染层换算
- 单文件不超过 400 行；组件不超过 200 行，超限拆分

### 数据契约（勿破坏）
- localStorage 键：`portfolio-site-data`（见 `storage.js` 的 `STORAGE_KEY`）
- 序列化根字段：`version`（当前 1）、`elements`、`theme`
- 元素必含：`id`(唯一)、`type`(七类之一)、`x/y/w/h`(百分比)、`z`、`props`
- 校验函数返回 `{ valid, errors: string[] }`，错误信息中文

### 测试规范
- 测试文件置于 `tests/`，命名 `<模块名>.test.js`
- 每条用例的 describe 标题包含对应 AC 编号（如 `describe('AC-3.9 元素校验')`），保证可追溯
- 纯函数优先；涉及 DOM 的测试跑在 jsdom 环境

### 分包要求（AC-1.3）
- 编辑器页面必须**懒加载**（动态 import），确保展示页 bundle 无编辑器代码
- 构建后需检查产物中 editor chunk 与展示 chunk 分离

## 禁止事项

- ❌ 引入后端服务 / 数据库 / 服务器端 API
- ❌ 在展示页引入编辑器模块
- ❌ 修改验收标准编号语义（只能新增或废弃标注）
- ❌ 使用 px 硬编码存储元素位置
- ❌ 英文界面文案与英文错误提示

## Memory Bank

跨会话上下文存于 `memory-bank/`（projectbrief / productContext / systemPatterns / techContext / activeContext / progress）。
**每完成一个实施阶段，必须同步更新 `memory-bank/progress.md` 与 `activeContext.md`。**
