import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { toBi, pickText, resolveBiDeep, LANGS } from '../src/core/i18n.js'
import { serialize, deserialize, exportJson, importJson, STORAGE_KEY } from '../src/core/storage.js'
import NavTop from '../src/components/NavTop.vue'
import EditorPage from '../src/pages/EditorPage.vue'
import { site, selectedId, initSite } from '../src/store/site.js'

// 覆盖验收标准：AC-12.1 ~ AC-12.4

beforeEach(() => {
  localStorage.clear()
})

function baseV2(over = {}) {
  const pages = [
    { key: 'home', name: { zh: '首页', en: 'Home' }, pageHeight: 100, elements: [ { id: 't1', type: 'text', x: 0, y: 0, w: 50, h: 10, z: 0, props: { content: { zh: '你好', en: 'Hi' } } } ] },
    { key: 'works', name: { zh: '作品集', en: 'Works' }, pageHeight: 100, elements: [] },
    { key: 'projects', name: { zh: '项目', en: 'Projects' }, pageHeight: 100, elements: [] },
    { key: 'about', name: { zh: '关于我', en: 'About' }, pageHeight: 100, elements: [] },
  ]
  return {
    locale: 'zh',
    motion: { level: 'standard' },
    published: { theme: 'glass', pages: JSON.parse(JSON.stringify(pages)) },
    draft: { theme: 'glass', pages },
    snapshots: [],
    ...over,
  }
}

describe('AC-12.1 双语字段结构归一化', () => {
  it('字符串归一化为 { zh, en }，英文缺省为空', () => {
    expect(toBi('你好')).toEqual({ zh: '你好', en: '' })
  })

  it('对象形式补全缺失语言字段', () => {
    expect(toBi({ zh: '你好' })).toEqual({ zh: '你好', en: '' })
    expect(toBi({ zh: '你好', en: 'Hello' })).toEqual({ zh: '你好', en: 'Hello' })
  })

  it('空值与非字符串输入归一化为全空双语', () => {
    expect(toBi(null)).toEqual({ zh: '', en: '' })
    expect(toBi(undefined)).toEqual({ zh: '', en: '' })
    expect(toBi(42)).toEqual({ zh: '', en: '' })
  })

  it('LANGS 固定为中英两种语言', () => {
    expect(LANGS).toEqual(['zh', 'en'])
  })
})

describe('AC-12.1 双语取值与回退', () => {
  const v = { zh: '你好', en: 'Hello' }

  it('按语言取值', () => {
    expect(pickText(v, 'zh')).toBe('你好')
    expect(pickText(v, 'en')).toBe('Hello')
  })

  it('英文缺失时回退中文', () => {
    expect(pickText({ zh: '你好', en: '' }, 'en')).toBe('你好')
  })

  it('中文缺失时回退英文', () => {
    expect(pickText({ zh: '', en: 'Hi' }, 'zh')).toBe('Hi')
  })

  it('纯字符串双语言同文；空值返回空串；非法语言按中文处理', () => {
    expect(pickText('你好', 'en')).toBe('你好')
    expect(pickText(null, 'zh')).toBe('')
    expect(pickText({ zh: '你好' }, 'fr')).toBe('你好')
  })
})

describe('AC-12.1 深层双语解析（导出渲染用）', () => {
  it('递归把数据树中的双语对象解析为当前语言字符串', () => {
    const input = {
      content: { zh: '你好', en: 'Hello' },
      nested: { images: [{ src: 'a.png', caption: { zh: '图一', en: 'One' } }] },
      keep: '纯字符串',
      num: 3,
    }
    expect(resolveBiDeep(input, 'zh')).toEqual({
      content: '你好',
      nested: { images: [{ src: 'a.png', caption: '图一' }] },
      keep: '纯字符串',
      num: 3,
    })
    expect(resolveBiDeep(input, 'en').nested.images[0].caption).toBe('One')
  })
})

describe('AC-12.3 语言偏好与双语文案持久化', () => {
  it('serialize 携带 locale，deserialize 恢复；非法 locale 回退中文', () => {
    expect(serialize(baseV2({ locale: 'en' })).locale).toBe('en')
    const restored = deserialize(JSON.stringify(serialize(baseV2({ locale: 'en' }))))
    expect(restored.locale).toBe('en')
    expect(serialize(baseV2({ locale: 'fr' })).locale).toBe('zh')
  })

  it('双语文案（{zh,en}）随导出/导入完整往返', () => {
    const restored = importJson(exportJson(baseV2()))
    expect(restored.published.pages[0].elements[0].props.content).toEqual({ zh: '你好', en: 'Hi' })
  })
})

describe('AC-12.2 展示页语言切换即时生效并持久化', () => {
  it('点击 EN 切换英文并写入 localStorage，点击中文切回', async () => {
    const w = mount(NavTop)
    const en = w.findAll('button').find((b) => b.text() === 'EN')
    await en.trigger('click')
    expect(site.locale).toBe('en')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).locale).toBe('en')

    const zhBtn = w.findAll('button').find((b) => b.text() === '中文')
    await zhBtn.trigger('click')
    expect(site.locale).toBe('zh')
    w.unmount()
  })
})

describe('AC-12.4 编辑器双语输入（界面保持中文）', () => {
  it('选中文本元素后提供中/英双输入，修改中文保留英文', async () => {
    initSite()
    const hero = site.draft.pages[0].elements.find((e) => e.type === 'text' && e.props.content?.en)
    selectedId.value = hero.id
    const w = mount(EditorPage)
    expect(w.text()).toContain('中文内容')
    expect(w.text()).toContain('英文内容')
    await w.findAll('textarea')[0].setValue('新中文口号')
    const cur = site.draft.pages[0].elements.find((e) => e.id === hero.id)
    expect(cur.props.content).toEqual({ zh: '新中文口号', en: hero.props.content.en })
    w.unmount()
  })

  it('链接卡片标题提供中/英双输入', async () => {
    initSite()
    const link = site.draft.pages.flatMap((p) => p.elements).find((e) => e.type === 'link')
    selectedId.value = link.id
    const w = mount(EditorPage)
    expect(w.text()).toContain('中文标题')
    expect(w.text()).toContain('英文标题')
    await w.find('input[placeholder="英文标题（选填）"]').setValue('Works')
    const cur = site.draft.pages.flatMap((p) => p.elements).find((e) => e.id === link.id)
    expect(cur.props.title).toEqual({ zh: link.props.title.zh, en: 'Works' })
    w.unmount()
  })
})
