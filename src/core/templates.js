/**
 * 区块模板库（AC-17.3）：内置常用排版模板，一键插入当前页
 * 每次实例化都经 createElement 重新生成 id；纯逻辑无副作用
 */
import {
  createText, createImage, createLink, createSkillTag,
  createGallery, createDecoration,
  createTimeline, createSkillMatrix, createHonors, createContactCard,
} from './schema.js'

const bi = (zh, en = '') => ({ zh, en })

/** 模板定义：工厂函数返回元素数组（默认布局，插入后用户可自由调整） */
const DEFS = {
  // 英雄区：光斑 + 大标题 + 副标 + CTA
  hero: () => [
    createDecoration({ shape: 'block', color: '#7dd3fc', opacity: 0.25, blur: 90, x: 55, y: 2, w: 42, h: 12, z: 0 }),
    createText({ content: bi('主标题', 'Headline'), fontSize: 52, weight: 700, align: 'center', color: '#eaf2ff', x: 12, y: 8, w: 76, h: 5, z: 2 }),
    createText({ content: bi('一句话介绍你的定位', 'One-line positioning'), fontSize: 16, align: 'center', color: '#b8c9e8', x: 20, y: 15, w: 60, h: 2, z: 2 }),
    createLink({ title: bi('查看作品 →', 'View Works →'), url: '#/works', x: 36, y: 20, w: 28, h: 3.5, z: 2 }),
  ],
  // 作品网格：标题 + 三图画廊
  worksGrid: () => [
    createText({ content: bi('精选作品', 'Selected Works'), fontSize: 28, weight: 700, color: '#eaf2ff', x: 8, y: 5, w: 40, h: 3, z: 2 }),
    createGallery({
      images: [
        { src: '', caption: bi('作品一', 'Work 1') },
        { src: '', caption: bi('作品二', 'Work 2') },
        { src: '', caption: bi('作品三', 'Work 3') },
      ],
      x: 8, y: 10, w: 84, h: 14, z: 2,
    }),
  ],
  // 项目案例卡：配图 + 标题 + 标签 + 外链
  projectCase: () => [
    createImage({ src: '', alt: bi('项目配图', 'Project'), x: 8, y: 8, w: 40, h: 18, z: 1 }),
    createText({ content: bi('项目名称', 'Project Name'), fontSize: 22, weight: 700, color: '#eaf2ff', x: 52, y: 9, w: 40, h: 3, z: 2 }),
    createText({ content: bi('项目简介：背景、职责与成果。', 'Brief: background, role and result.'), fontSize: 14, color: '#b8c9e8', x: 52, y: 13, w: 40, h: 6, z: 2 }),
    createSkillTag({ tags: ['Vue', 'WebGL'], x: 52, y: 20, w: 40, h: 2.5, z: 2 }),
    createLink({ title: bi('了解详情 →', 'Learn More →'), url: 'https://', x: 52, y: 23, w: 24, h: 3, z: 2 }),
  ],
  // 时间线
  timeline: () => [
    createText({ content: bi('成长时间线', 'Timeline'), fontSize: 28, weight: 700, color: '#eaf2ff', x: 8, y: 5, w: 40, h: 3, z: 2 }),
    createTimeline({
      items: [
        { date: '2024', title: bi('里程碑一', 'Milestone 1'), desc: bi('发生了什么', 'What happened') },
        { date: '2025', title: bi('里程碑二', 'Milestone 2'), desc: bi('发生了什么', 'What happened') },
      ],
      x: 8, y: 10, w: 84, h: 22, z: 2,
    }),
  ],
  // 技能矩阵
  skillMatrix: () => [
    createText({ content: bi('技能矩阵', 'Skills'), fontSize: 28, weight: 700, color: '#eaf2ff', x: 8, y: 5, w: 40, h: 3, z: 2 }),
    createSkillMatrix({
      items: [
        { name: 'Vue', level: 90 }, { name: 'TypeScript', level: 80 },
        { name: 'Node.js', level: 70 }, { name: '设计', level: 65 },
      ],
      x: 8, y: 10, w: 84, h: 18, z: 2,
    }),
  ],
  // 荣誉墙
  honors: () => [
    createText({ content: bi('荣誉与证书', 'Honors'), fontSize: 28, weight: 700, color: '#eaf2ff', x: 8, y: 5, w: 40, h: 3, z: 2 }),
    createHonors({
      items: [
        { title: bi('荣誉名称', 'Award'), issuer: '颁发机构', date: '2025', link: '' },
      ],
      x: 8, y: 10, w: 84, h: 16, z: 2,
    }),
  ],
  // 联系区
  contact: () => [
    createText({ content: bi('联系我', 'Contact'), fontSize: 28, weight: 700, color: '#eaf2ff', x: 8, y: 6, w: 40, h: 3, z: 2 }),
    createContactCard({
      items: [
        { label: bi('邮箱', 'Email'), value: 'me@example.com', href: 'mailto:me@example.com' },
        { label: bi('GitHub', 'GitHub'), value: 'github.com/me', href: 'https://github.com/me' },
      ],
      x: 8, y: 11, w: 50, h: 14, z: 2,
    }),
  ],
  // 关于我简介
  aboutProfile: () => [
    createImage({ src: '', alt: bi('个人照片', 'Portrait'), x: 8, y: 8, w: 16, h: 20, z: 1 }),
    createText({ content: bi('你好，我是……', 'Hi, I am...'), fontSize: 26, weight: 700, color: '#eaf2ff', x: 28, y: 9, w: 60, h: 3, z: 2 }),
    createText({ content: bi('一段自我介绍，讲清你是谁、在做什么、相信什么。', 'Self introduction paragraph.'), fontSize: 15, color: '#b8c9e8', x: 28, y: 14, w: 60, h: 8, z: 2 }),
    createSkillTag({ tags: ['Vue', 'TypeScript', 'Figma'], x: 28, y: 23, w: 50, h: 2.5, z: 2 }),
  ],
}

/** 模板 key 列表（AC-17.3，≥8 组） */
export const TEMPLATE_KEYS = Object.keys(DEFS)

/** 模板元信息 + 元素（label 中文界面用） */
export const TEMPLATES = {
  hero: { label: '英雄区', elements: DEFS.hero() },
  worksGrid: { label: '作品网格', elements: DEFS.worksGrid() },
  projectCase: { label: '项目案例', elements: DEFS.projectCase() },
  timeline: { label: '时间线', elements: DEFS.timeline() },
  skillMatrix: { label: '技能矩阵', elements: DEFS.skillMatrix() },
  honors: { label: '荣誉墙', elements: DEFS.honors() },
  contact: { label: '联系区', elements: DEFS.contact() },
  aboutProfile: { label: '关于简介', elements: DEFS.aboutProfile() },
}

/**
 * 实例化模板（AC-17.3）：重新执行工厂 → 全部元素 id 重新生成
 * @returns {Array} 元素数组（深独立，可直接并入当前页）
 */
export function instantiateTemplate(key) {
  if (!DEFS[key]) throw new Error(`未知区块模板：${key}`)
  return DEFS[key]()
}
