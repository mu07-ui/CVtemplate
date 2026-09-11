import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  findAlignGuides,
  applyGuides,
} from '../src/core/align.js'
import {
  TEMPLATE_KEYS,
  TEMPLATES,
  instantiateTemplate,
} from '../src/core/templates.js'
import {
  boxSelect,
  shiftToggle,
  moveMany,
  alignElements,
  rectsIntersect,
} from '../src/core/multiselect.js'
import { ELEMENT_TYPES } from '../src/core/schema.js'
import LayerPanel from '../src/components/LayerPanel.vue'
import TemplateLibrary from '../src/components/TemplateLibrary.vue'
import {
  site, resetSite, selectedId, selectedIds,
  insertTemplate, toggleVisible, toggleLocked, renameElement,
  toggleSelection, clearSelection, removeSelected, alignSelected,
  setCurrentPage,
} from '../src/store/site.js'

// 覆盖验收标准：AC-17.1 ~ AC-17.4

beforeEach(() => {
  localStorage.clear()
  resetSite()
  clearSelection()
})

const rect = (x, y, w = 10, h = 5) => ({ x, y, w, h })

describe('AC-17.2 智能对齐线（纯逻辑）', () => {
  it('左边缘接近时产生垂直对齐线与吸附 delta', () => {
    const others = [rect(20, 40)]
    const g = findAlignGuides(rect(20.8, 10), others, 1.5)
    expect(g.vertical).not.toBeNull()
    expect(g.vertical.at).toBe(20)
    expect(g.vertical.delta).toBeCloseTo(-0.8, 5)
  })

  it('中心对齐画布中线（50）产生参考线', () => {
    const g = findAlignGuides(rect(46, 10, 8, 5), [], 1.5) // 中心 = 50
    expect(g.vertical.at).toBe(50)
  })

  it('超过阈值无参考线', () => {
    const g = findAlignGuides(rect(0, 10), [rect(40, 40)], 1.5)
    expect(g.vertical).toBeNull()
  })

  it('applyGuides 按 delta 修正坐标', () => {
    const guides = { vertical: { at: 20, edge: 'left', delta: -0.8 }, horizontal: null }
    const p = applyGuides(rect(20.8, 10), guides)
    expect(p.x).toBeCloseTo(20, 5)
    expect(p.y).toBe(10)
  })

  it('水平参考线：顶边吸附', () => {
    const g = findAlignGuides(rect(10, 44), [rect(60, 44, 10, 10)], 1.5)
    expect(g.horizontal).not.toBeNull()
    expect(g.horizontal.at).toBe(44)
    expect(g.horizontal.delta).toBeCloseTo(0, 5)
  })

  it('底边与他元素顶边接近时吸附（delta 非零）', () => {
    // 拖拽元素 y=36,h=8 → 底边 44；参考元素顶边 44.8，阈值内
    const g = findAlignGuides(rect(10, 36, 10, 8), [rect(60, 44.8, 10, 10)], 1.5)
    expect(g.horizontal).not.toBeNull()
    expect(g.horizontal.at).toBe(44.8)
    expect(g.horizontal.edge).toBe('bottom')
    expect(g.horizontal.delta).toBeCloseTo(0.8, 5)
  })
})

describe('AC-17.4 多选纯逻辑', () => {
  it('rectsIntersect 判断相交/包含', () => {
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toBe(true)
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(20, 20, 5, 5))).toBe(false)
  })

  it('boxSelect 返回与框选矩形相交的元素 id', () => {
    const els = [
      { id: 'a', x: 0, y: 0, w: 10, h: 10, visible: true },
      { id: 'b', x: 50, y: 50, w: 10, h: 10, visible: true },
      { id: 'c', x: 5, y: 5, w: 10, h: 10, visible: false },
    ]
    const ids = boxSelect(els, rect(0, 0, 12, 12))
    expect(ids).toContain('a')
    expect(ids).not.toContain('b')
    expect(ids).not.toContain('c') // 隐藏元素不参与框选
  })

  it('shiftToggle 加选/减选；普通点击替换选择', () => {
    expect(shiftToggle([], 'a')).toEqual(['a'])
    expect(shiftToggle(['a'], 'b')).toEqual(['a', 'b'])
    expect(shiftToggle(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('moveMany 批量位移并钳制在 0~100', () => {
    const els = [
      { id: 'a', x: 5, y: 5, w: 10, h: 10 },
      { id: 'b', x: 90, y: 90, w: 20, h: 20 },
    ]
    const moved = moveMany(els, ['a', 'b'], -10, -10)
    expect(moved.find((e) => e.id === 'a').x).toBe(0)
    expect(moved.find((e) => e.id === 'b').x).toBe(80)
  })

  it('alignElements 批量左对齐到最小 x', () => {
    const els = [
      { id: 'a', x: 30, y: 0, w: 10, h: 5 },
      { id: 'b', x: 50, y: 0, w: 10, h: 5 },
    ]
    const aligned = alignElements(els, ['a', 'b'], 'left')
    expect(aligned.find((e) => e.id === 'a').x).toBe(30)
    expect(aligned.find((e) => e.id === 'b').x).toBe(30)
  })
})

describe('AC-17.3 区块模板库', () => {
  it('内置模板不少于 8 组，每组含 key/label/elements', () => {
    expect(TEMPLATE_KEYS.length).toBeGreaterThanOrEqual(8)
    for (const key of TEMPLATE_KEYS) {
      expect(TEMPLATES[key].label).toBeTruthy()
      expect(Array.isArray(TEMPLATES[key].elements)).toBe(true)
      expect(TEMPLATES[key].elements.length).toBeGreaterThan(0)
    }
  })

  it('instantiateTemplate 返回新元素数组且 id 全部重新生成', () => {
    const a = instantiateTemplate('hero')
    const b = instantiateTemplate('hero')
    const idsA = a.map((e) => e.id)
    const idsB = b.map((e) => e.id)
    expect(new Set(idsA).size).toBe(idsA.length)
    expect(idsA.some((id) => idsB.includes(id))).toBe(false)
  })

  it('模板元素类型全部合法', () => {
    for (const key of TEMPLATE_KEYS) {
      for (const el of instantiateTemplate(key)) {
        expect(ELEMENT_TYPES, `模板 ${key} 含非法类型 ${el.type}`).toContain(el.type)
      }
    }
  })

  it('未知模板 key 抛中文错误', () => {
    expect(() => instantiateTemplate('nope')).toThrow(/模板/)
  })
})

describe('AC-17.1 图层面板组件', () => {
  it('渲染当前页元素列表，点击条目同步选中', async () => {
    const w = mount(LayerPanel)
    await w.vm.$nextTick()
    const items = w.findAll('.layer-item')
    expect(items.length).toBeGreaterThan(0)
    await items[0].trigger('click')
    expect(selectedId.value).toBeTruthy()
  })

  it('眼睛按钮切换显隐、锁按钮切换锁定', async () => {
    const w = mount(LayerPanel)
    await w.vm.$nextTick()
    const first = site.draft.pages[0].elements[0]
    const before = first.visible
    await w.findAll('.layer-item')[0].find('.btn-visible').trigger('click')
    expect(site.draft.pages[0].elements[0].visible).toBe(!before)
    await w.findAll('.layer-item')[0].find('.btn-lock').trigger('click')
    expect(site.draft.pages[0].elements[0].locked).toBe(true)
  })

  it('改名输入更新元素 name', async () => {
    const w = mount(LayerPanel)
    await w.vm.$nextTick()
    const input = w.findAll('.layer-item')[0].find('.layer-name')
    await input.setValue('英雄标题')
    expect(site.draft.pages[0].elements[0].name).toBe('英雄标题')
  })
})

describe('AC-17.3 模板库组件', () => {
  it('渲染不少于 8 个模板按钮，点击后当前页元素增加', async () => {
    setCurrentPage('works')
    const before = site.draft.pages.find((p) => p.key === 'works').elements.length
    const w = mount(TemplateLibrary)
    const btns = w.findAll('.tpl-btn')
    expect(btns.length).toBeGreaterThanOrEqual(8)
    await btns[1].trigger('click')
    const after = site.draft.pages.find((p) => p.key === 'works').elements.length
    expect(after).toBeGreaterThan(before)
  })
})

describe('AC-17.4 store 多选操作', () => {
  it('toggleSelection 单选替换 / 加选累积', () => {
    const id1 = site.draft.pages[0].elements[0].id
    const id2 = site.draft.pages[0].elements[1].id
    toggleSelection(id1, false)
    expect(selectedIds.value).toEqual([id1])
    toggleSelection(id2, true)
    expect(selectedIds.value).toEqual([id1, id2])
    toggleSelection(id1, true)
    expect(selectedIds.value).toEqual([id2])
  })

  it('removeSelected 批量删除；alignSelected 批量对齐不报错', () => {
    const page = site.draft.pages[0]
    const ids = page.elements.slice(0, 2).map((e) => e.id)
    ids.forEach((id) => toggleSelection(id, true))
    const before = page.elements.length
    removeSelected()
    expect(page.elements.length).toBe(before - 2)
    expect(selectedIds.value).toEqual([])
  })
})
