<template>
  <div
    ref="stage"
    class="stage"
    :class="{ anim: animate }"
    :style="stageStyle"
    @pointerdown.self="onStageDown"
  >
    <TechBackdrop :theme-id="themeId" :motion-level="motionLevel" />
    <div
      v-for="(el, i) in sorted"
      v-show="interactive || el.visible !== false"
      :key="el.id"
      class="element"
      :class="{
        selected: interactive && selectedIds.includes(el.id),
        in: !animate || inView.has(el.id),
        'layer-hidden': interactive && el.visible === false,
        locked: interactive && el.locked,
      }"
      :data-eid="el.id"
      :style="{ left: el.x + '%', top: el.y + '%', width: el.w + '%', height: el.h + '%', zIndex: el.z, transitionDelay: animate ? ((i % 6) * 0.07) + 's' : null }"
      @pointerdown.stop="onElementDown($event, el)"
    >
      <ElementRenderer :element="el" :scale="scale" />
    </div>

    <!-- AC-17.2 对齐参考线 -->
    <div v-if="guides.vertical" class="guide guide-v" :style="{ left: guides.vertical.at + '%' }"></div>
    <div v-if="guides.horizontal" class="guide guide-h" :style="{ top: guides.horizontal.at + '%' }"></div>
    <!-- AC-17.4 框选矩形 -->
    <div
      v-if="marquee"
      class="marquee"
      :style="{ left: marquee.x + '%', top: marquee.y + '%', width: marquee.w + '%', height: marquee.h + '%' }"
    ></div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ElementRenderer from './ElementRenderer.vue'
import TechBackdrop from './TechBackdrop.vue'
import { THEMES, isThemeId } from '../core/theme.js'
import { useStageDrag } from '../composables/useStageDrag.js'

const props = defineProps({
  elements: { type: Array, required: true },
  themeId: { type: String, default: 'business' },
  motionLevel: { type: String, default: 'standard' },
  pageHeight: { type: Number, default: 100 }, // 画布总高（vh），支持纵向叙事
  interactive: { type: Boolean, default: false },
  selectedId: { type: String, default: null },
  selectedIds: { type: Array, default: () => [] }, // AC-17.4 多选
  snap: { type: Boolean, default: true },
  alignGuides: { type: Boolean, default: true }, // AC-17.2 智能对齐线开关
  animate: { type: Boolean, default: false }, // 滚动进场动画（仅展示/导出态）
})
const emit = defineEmits(['select', 'move', 'move-many', 'boxselect', 'commit'])

const stage = ref(null)
const scale = ref(1)
const sorted = computed(() => [...props.elements].sort((a, b) => a.z - b.z))
const { guides, marquee, onElementDown, onStageDown } = useStageDrag({ stage, props, emit })

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
    inView.value = new Set(sorted.value.map((e) => e.id)) // 测试环境兜底
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
</script>

<style scoped>
.stage { position: relative; width: 100%; overflow: hidden; font-family: var(--font); }
.element { position: absolute; }
.element.selected { outline: 2px solid var(--primary); outline-offset: 2px; cursor: move; }
.element.locked { cursor: not-allowed; }
.element.layer-hidden { opacity: 0.15; pointer-events: none; filter: grayscale(1); }

/* AC-17.2 对齐参考线 / AC-17.4 框选矩形 */
.guide { position: absolute; background: #f43f5e; pointer-events: none; z-index: 999; }
.guide-v { top: 0; bottom: 0; width: 1px; }
.guide-h { left: 0; right: 0; height: 1px; }
.marquee {
  position: absolute; z-index: 998; pointer-events: none;
  background: rgba(56, 189, 248, 0.12);
  border: 1px dashed rgba(56, 189, 248, 0.8);
}

/* 官网式滚动进场（仅展示/导出态）：进入视口时点亮 */
.stage.anim .element {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.8s cubic-bezier(0.2, 0.7, 0.3, 1), transform 0.8s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.stage.anim .element.in { opacity: 1; transform: none; }
</style>
