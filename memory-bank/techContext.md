# 技术上下文（Tech Context）

## 技术栈
| 层 | 选型 | 版本 | 说明 |
|---|---|---|---|
| 构建 | Vite | ^5.2 | 静态产物，无 SSR |
| 框架 | Vue 3 | ^3.4 | Composition API + `<script setup>` |
| 测试 | Vitest | ^1.6 | jsdom 环境，`tests/*.test.js` |
| 运行环境 | 浏览器 | 现代浏览器 | localStorage、FileReader、Blob 下载 |

## 待引入（实现阶段按需）
- `jszip`：导出静态站 ZIP
- `file-saver`：触发浏览器下载
- PDF：优先浏览器打印方案（`window.print` + 打印样式），重方案再考虑 jsPDF

## 脚本
```bash
npm run dev         # 开发服务器
npm test            # vitest run（CI 用）
npm run test:watch  # 监听模式
npm run build       # 产出 dist/
```

## 关键技术约束
1. **零后端**：一切持久化依赖 localStorage + 导出文件，无 API 调用
2. **坐标百分比**：元素位置禁止以 px 存储（AC-2.1）
3. **中文文案**：所有用户可见文本与错误消息中文（AC-7.4）
4. **无 UI 库**：组件手写，主题靠 CSS 变量切换
5. **Windows 开发环境**：路径使用 `e:\TRAE`，命令走 PowerShell

## 外部依赖服务
- 视频：B站 / YouTube iframe 嵌入（无 SDK，仅 URL 解析）
- 图片：本地上传转 dataURL 内联，无图床

## 已知风险
- localStorage 容量约 5MB：大视频上传会超限 → 导出 ZIP/PDF 时需提示，视频优先外链
- dataURL 大素材拖慢页面 → 渲染层需懒加载
