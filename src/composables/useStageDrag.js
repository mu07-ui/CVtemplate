/**
 * 画布交互拖拽（AC-2.3/2.4/2.5 + AC-17.2 对齐线 + AC-17.4 多选/框选）
 * composable：保持 CanvasStage 组件行数精简
 */
import { ref } from 'vue'
import { pxToPercent, snapToGrid } from '../core/canvas.js'
import { findAlignGuides, applyGuides } from '../core/align.js'

const clamp = (v) => Math.min(100, Math.max(0, Math.round(v * 100) / 100))
const MOVE_TOLERANCE = 3 // 框选触发阈值（px）

export function useStageDrag({ stage, props, emit }) {
  /** 当前吸附参考线（用于画布绘制） */
  const guides = ref({ vertical: null, horizontal: null })
  /** 框选矩形（百分比） */
  const marquee = ref(null)
  let session = null

  /** 元素指针按下：锁定元素不可拖；Shift 加选 */
  function onElementDown(e, el) {
    if (!props.interactive || el.locked) return
    emit('select', el.id, e.shiftKey)
    const rect = stage.value.getBoundingClientRect()
    session = {
      mode: 'drag', el, rect,
      startX: e.clientX, startY: e.clientY,
      x0: el.x, y0: el.y,
      multi: selectedIds.value.includes(el.id) && selectedIds.value.length > 1,
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  /** 画布空白按下：开始潜在框选 */
  function onStageDown(e) {
    if (!props.interactive) return
    const rect = stage.value.getBoundingClientRect()
    session = {
      mode: 'maybe-marquee', rect,
      startX: e.clientX, startY: e.clientY,
      x0: pxToPercent(e.clientX - rect.left, rect.width),
      y0: pxToPercent(e.clientY - rect.top, rect.height),
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  function onPointerMove(e) {
    if (!session) return
    if (session.mode === 'drag') {
      handleDragMove(e)
    } else {
      handleMarqueeMove(e)
    }
  }

  function handleDragMove(e) {
    const s = session
    let nx = s.x0 + pxToPercent(e.clientX - s.startX, s.rect.width)
    let ny = s.y0 + pxToPercent(e.clientY - s.startY, s.rect.height)
    if (props.snap) {
      nx = snapToGrid(nx, pxToPercent(8, s.rect.width))
      ny = snapToGrid(ny, pxToPercent(8, s.rect.height))
    }
    // AC-17.2 智能对齐线（可开关）：与其他可见元素边缘/中心及画布中心吸附
    if (props.alignGuides) {
      const others = props.elements.filter((o) => o.id !== s.el.id && o.visible !== false)
      const found = findAlignGuides({ x: nx, y: ny, w: s.el.w, h: s.el.h }, others)
      guides.value = found
      const fixed = applyGuides({ x: nx, y: ny }, found)
      nx = fixed.x
      ny = fixed.y
    } else {
      guides.value = { vertical: null, horizontal: null }
    }
    nx = clamp(nx)
    ny = clamp(ny)
    if (s.multi) emit('move-many', { id: s.el.id, x: nx, y: ny })
    else emit('move', { id: s.el.id, x: nx, y: ny })
  }

  function handleMarqueeMove(e) {
    const s = session
    const moved = Math.abs(e.clientX - s.startX) + Math.abs(e.clientY - s.startY)
    if (s.mode === 'maybe-marquee' && moved > MOVE_TOLERANCE) s.mode = 'marquee'
    if (s.mode !== 'marquee') return
    const x1 = pxToPercent(e.clientX - s.rect.left, s.rect.width)
    const y1 = pxToPercent(e.clientY - s.rect.top, s.rect.height)
    marquee.value = {
      x: Math.min(s.x0, x1), y: Math.min(s.y0, y1),
      w: Math.abs(x1 - s.x0), h: Math.abs(y1 - s.y0),
    }
  }

  function onPointerUp() {
    const s = session
    session = null
    guides.value = { vertical: null, horizontal: null }
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    if (s?.mode === 'marquee') {
      emit('boxselect', marquee.value)
      marquee.value = null
    } else if (s?.mode === 'maybe-marquee') {
      emit('select', null, false)
    } else if (s?.mode === 'drag') {
      emit('commit')
    }
  }

  return { guides, marquee, onElementDown, onStageDown }
}
