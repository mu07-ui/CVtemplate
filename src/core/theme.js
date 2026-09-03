/**
 * 主题系统：三套内置主题（官网级视觉：深色沉浸 + 光晕氛围）
 * 覆盖验收标准：AC-4.1 ~ AC-4.4
 */

export const THEMES = {
  // 曜蓝商务：深藏青夜空 + 电光蓝 + 香槟金点缀（AC-4.1）
  business: {
    background: '#0a0f1e',
    foreground: '#e8edf7',
    primary: '#4c6fff',
    accent: '#c9a86a',
    radius: '12px',
    shadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    font: "'PingFang SC', 'Source Han Sans SC', 'Microsoft YaHei', sans-serif",
    backdrop:
      'radial-gradient(1100px 700px at 85% -5%, rgba(76, 111, 255, 0.28), transparent 60%),'
      + ' radial-gradient(900px 600px at -5% 105%, rgba(201, 168, 106, 0.15), transparent 55%),'
      + ' linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),'
      + ' linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px),'
      + ' #0a0f1e',
    backdropSize: 'auto, auto, 56px 56px, 56px 56px, auto',
  },
  // 星穹拟态：深空底 + 青紫极光 + 毛玻璃质感
  glass: {
    background: '#070b18',
    foreground: '#eaf2ff',
    primary: '#7dd3fc',
    accent: '#a78bfa',
    radius: '20px',
    shadow: '0 8px 40px rgba(125, 211, 252, 0.15)',
    font: "'PingFang SC', 'Source Han Sans SC', 'Microsoft YaHei', sans-serif",
    backdrop:
      'radial-gradient(1000px 700px at 80% 0%, rgba(125, 211, 252, 0.22), transparent 60%),'
      + ' radial-gradient(900px 700px at 10% 30%, rgba(167, 139, 250, 0.18), transparent 55%),'
      + ' radial-gradient(1000px 800px at 50% 110%, rgba(56, 189, 248, 0.14), transparent 60%),'
      + ' #070b18',
    backdropSize: 'auto, auto, auto, auto',
  },
  // 霓虹像素：暗紫底 + 品红/电光青双色霓虹 + 扫描线
  pixel: {
    background: '#0d0221',
    foreground: '#f8f2ff',
    primary: '#ff2fb3',
    accent: '#00f0ff',
    radius: '0px',
    shadow: '6px 6px 0 rgba(255, 47, 179, 0.9)',
    font: "'Zpix', 'Press Start 2P', 'Courier New', monospace",
    backdrop:
      'radial-gradient(900px 600px at 90% 10%, rgba(255, 47, 179, 0.2), transparent 55%),'
      + ' radial-gradient(800px 600px at 5% 90%, rgba(0, 240, 255, 0.16), transparent 55%),'
      + ' repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.03) 0px, rgba(255, 255, 255, 0.03) 1px, transparent 1px, transparent 4px),'
      + ' #0d0221',
    backdropSize: 'auto, auto, auto, auto',
  },
}

/** 主题 id 列表（AC-4.1） */
export const THEME_IDS = Object.keys(THEMES)

/** 校验主题 id 是否合法（AC-4.3） */
export const isThemeId = (id) => Object.prototype.hasOwnProperty.call(THEMES, id)

/** 应用主题到 document 根节点（AC-4.3） */
export function applyTheme(id) {
  if (!isThemeId(id)) {
    throw new Error(`未知主题：${id}`)
  }
  const t = THEMES[id]
  const root = document.documentElement
  root.style.setProperty('--bg', t.background)
  root.style.setProperty('--fg', t.foreground)
  root.style.setProperty('--primary', t.primary)
  root.style.setProperty('--accent', t.accent)
  root.style.setProperty('--radius', t.radius)
  root.style.setProperty('--shadow', t.shadow)
  root.style.setProperty('--font', t.font)
}
