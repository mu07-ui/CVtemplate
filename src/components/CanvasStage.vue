<template>
  <div
    ref="stage"
    class="stage"
    :class="{ anim: animate }"
    :style="stageStyle"
    @pointerdown.self="$emit('select', null)"
  >
    <TechBackdrop />
    <div
      v-for="(el, i) in sorted"
      :key="el.id"
      class="element"
      :class="{ selected: interactive && el.id === selectedId, in: !animate || inView.has(el.id) }"
      :data-eid="el.id"
      :style="{ left: el.x + '%', top: el.y + '%', width: el.w + '%', height: el.h + '%', zIndex: el.z, transitionDelay: animate ? ((i % 6) * 0.07) + 's' : null }"
      @pointerdown.stop="interactive && onDown($event, el)"
    >
      <ElementRenderer :element="el" :scale="scale" />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ElementRenderer from './ElementRenderer.vue'
import TechBackdrop from './TechBackdrop.vue'
import { THEMES, isThemeId } from '../core/theme.js'
import { pxToPercent, snapToGrid } from '../core/canvas.js'

const props = defineProps({
  elements: { type: Array, required: true },
  themeId: { type: String, default: 'business' },
  pageHeight: { type: Number, default: 100 }, // 画布总高（vh），支持纵向叙事
  interactive: { type: Boolean, default: false },
  selectedId: { type: String, default: null },
  snap: { type: Boolean, default: true },
  animate: { type: Boolean, default: false }, // 滚动进场动画（仅展示/导出态）
})
const emit = defineEmits(['select', 'move', 'commit'])

const stage = ref(null)
const scale = ref(1)
const sorted = computed(() => [...props.elements].sort((a, b) => a.z - b.z))

const theme = computed(() => (isThemeId(props.themeId) ? THEMES[props.themeId] : THEMES.business))
const stageStyle = computed(() => ({
  background: theme.value.backdrop,
  backgroundSize: theme.value.backdropSize,
  height: props.pageHeight + 'vh',
}))

function measure() {
  if (stage.value) scale.value = stage.value.clientWidth / 1440
}

// ── 官网式滚动进场：元素进入视口时点亮（与导出页运行时行为一致）──
const inView = ref(new Set())
let io = null
function setupReveal() {
  teardownReveal()
  if (!props.animate) return
  if (typeof IntersectionObserver === 'undefined') {
    // 测试环境兜底：全部直接显示
    inView.value = new Set(sorted.value.map((e) => e.id))
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          inView.value.add(en.target.dataset.eid)
          io.unobserve(en.target)
        }
      })
    },
    { threshold: 0.12 },
  )
  if (stage.value) Array.from(stage.value.children).forEach((n) => io.observe(n))
}
function teardownReveal() {
  if (io) {
    io.disconnect()
    io = null
  }
}
watch(
  () => props.elements.map((e) => e.id).join(','),
  () => nextTick(setupReveal),
)
watch(() => props.animate, () => nextTick(setupReveal))

onMounted(() => {
  measure()
  setupReveal()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => {
  teardownReveal()
  window.removeEventListener('resize', measure)
})

// 拖拽（AC-2.3）：像素位移 → 百分比回写，可选网格吸附（AC-2.4/2.5）
let drag = null
function onDown(e, el) {
  emit('select', el.id)
  const rect = stage.value.getBoundingClientRect()
  drag = { el, rect, startX: e.clientX, startY: e.clientY, x0: el.x, y0: el.y }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
function onMove(e) {
  if (!drag) return
  const dx = pxToPercent(e.clientX - drag.startX, drag.rect.width)
  const dy = pxToPercent(e.clientY - drag.startY, drag.rect.height)
  let nx = drag.x0 + dx
  let ny = drag.y0 + dy
  if (props.snap) {
    // 网格吸附：8px 当量换算为百分比
    const g = pxToPercent(8, drag.rect.width)
    const gy = pxToPercent(8, drag.rect.height)
    nx = snapToGrid(nx, g)
    ny = snapToGrid(ny, gy)
  }
  emit('move', { id: drag.el.id, x: clamp(nx), y: clamp(ny) })
}
function onUp() {
  if (drag) emit('commit')
  drag = null
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
}
const clamp = (v) => Math.min(100, Math.max(0, Math.round(v * 100) / 100))
</script>

<style scoped>
.stage {
  position: relative; width: 100%; overflow: hidden;
  font-family: var(--font);
}
.element { position: absolute; }
.element.selected { outline: 2px solid var(--primary); outline-offset: 2px; cursor: move; }

/* 官网式滚动进场（仅展示/导出态）：进入视口时点亮 */
.stage.anim .element {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.8s cubic-bezier(0.2, 0.7, 0.3, 1), transform 0.8s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.stage.anim .element.in { opacity: 1; transform: none; }
</style>
