<template>
  <div class="showcase-page" :class="{ 'is-mobile': device === 'mobile' }">
    <!-- AC-10.3：平板/桌面顶部导航；AC-11.2：手机底部标签栏 -->
    <NavTop v-if="device !== 'mobile'" :page-key="pageKey" />
    <MobileTabBar v-else :page-key="pageKey" />
    <CanvasStage
      :elements="page.elements"
      :theme-id="site.published.theme"
      :motion-level="site.motion.level"
      :page-height="page.pageHeight"
      :animate="true"
      :interactive="false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import NavTop from '../../components/NavTop.vue'
import MobileTabBar from '../../components/MobileTabBar.vue'
import CanvasStage from '../../components/CanvasStage.vue'
import { useDevice } from '../../composables/useDevice.js'
import { site, initSite } from '../../store/site.js'
import { pageAt, PAGE_KEYS } from '../../core/pages.js'

// 展示页（AC-10.2）：同一组件渲染四页，数据取公开展示态 published
const props = defineProps({ pageKey: { type: String, default: 'home' } })
const { device } = useDevice()
const router = useRouter()

const page = computed(
  () => pageAt(site.published.pages, props.pageKey) ?? pageAt(site.published.pages, 'home'),
)

// AC-10.10 滚动到底后继续向下滚动滚轮进入下一页（首页→作品集→项目→关于我）。
// 纯展示提示不响应点击；带累积阈值与翻页冷却，吸收触控板惯性避免误触。
let wheelAccum = 0
let wheelLast = 0
let wheelLock = 0
function onWheel(e) {
  const now = Date.now()
  if (now < wheelLock) return
  if (!e.deltaY || e.deltaY <= 0) { wheelAccum = 0; return }
  if (now - wheelLast > 400) wheelAccum = 0
  wheelLast = now
  const doc = document.documentElement
  if (window.innerHeight + window.scrollY < doc.scrollHeight - 2) { wheelAccum = 0; return }
  wheelAccum += e.deltaY
  if (wheelAccum < 160) return
  wheelAccum = 0
  wheelLock = now + 1200
  const next = PAGE_KEYS[PAGE_KEYS.indexOf(props.pageKey) + 1]
  if (next && router) router.push('/' + next)
}

onMounted(() => {
  initSite()
  window.addEventListener('wheel', onWheel, { passive: true })
})
onUnmounted(() => window.removeEventListener('wheel', onWheel))
</script>

<style scoped>
.showcase-page { width: 100%; }
/* 手机端为底部标签栏预留空间（AC-11.3 无横向滚动） */
.showcase-page.is-mobile { padding-bottom: env(safe-area-inset-bottom, 0px); }
</style>
