<template>
  <div class="display-page">
    <CanvasStage
      :elements="site.elements"
      :theme-id="site.theme"
      :page-height="site.pageHeight ?? 100"
      :animate="true"
      :interactive="false"
    />
    <SectionNav :sections="normalized" :active="active" @goto="goto" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CanvasStage from '../components/CanvasStage.vue'
import SectionNav from '../components/SectionNav.vue'
import { site, initSite } from '../store/site.js'
import { clampIndex, normalizeSections, sectionIndexAt } from '../core/sections.js'

const normalized = computed(() => normalizeSections(site.sections))
const active = ref(0)

/** 画布总像素高度 = pageHeight(vh) 对应视口高度 */
function stagePx() {
  return ((site.pageHeight ?? 100) / 100) * window.innerHeight
}

/** 滚动同步（AC-9.3）：进度 = 已滚过画布的百分比 → 当前分区 */
function onScroll() {
  active.value = sectionIndexAt((window.scrollY / stagePx()) * 100, normalized.value)
}

/** 点击页码/翻页（AC-9.2）：平滑滚动到分区起始位置 */
function goto(i) {
  const target = clampIndex(i, normalized.value.length)
  window.scrollTo({ top: (normalized.value[target].y / 100) * stagePx(), behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
/* 高度随画布 pageHeight 撑开，官网式纵向滚动 */
.display-page { width: 100%; }
</style>
