<template>
  <!-- AC-11.5：工坊仅保证 PC 体验，窄屏只显示中文提示，不渲染编辑面板与画布 -->
  <div v-if="device === 'mobile'" class="narrow-tip">
    <div class="tip-card">
      <div class="tip-icon">🖥</div>
      <h2>建议使用电脑编辑</h2>
      <p>可视化工坊仅在电脑端（宽度 ≥640px）提供完整编辑体验，手机或窄屏设备无法承载自由画布操作。</p>
      <p>你可以在手机端浏览展示页，或切换至电脑后继续编辑。</p>
      <a href="#/">返回首页浏览 →</a>
    </div>
  </div>

  <div v-else class="editor-page">
    <!-- 左侧编辑面板 25%（AC-1.1） -->
    <aside class="panel">
      <h1 class="brand">作品集编辑器</h1>

      <section class="group">
        <h2>添加元素</h2>
        <div class="btn-grid">
          <button v-for="t in TYPES" :key="t.id" @click="addElement(t.id)">{{ t.label }}</button>
        </div>
      </section>

      <section class="group">
        <h2>页面</h2>
        <div class="btn-grid">
          <button
            v-for="k in PAGE_KEYS"
            :key="k"
            :class="{ on: currentPage === k }"
            @click="setCurrentPage(k)"
          >{{ DEFAULT_PAGE_NAMES[k].zh }}</button>
        </div>
      </section>

      <PropsPanel />

      <!-- AC-17.3 区块模板库 -->
      <section class="group">
        <h2>区块模板</h2>
        <TemplateLibrary />
      </section>

      <!-- AC-17.1 图层面板 -->
      <section class="group">
        <h2>图层</h2>
        <LayerPanel />
      </section>

      <CanvasSettings v-model:snap="snap" v-model:align-guides="alignGuides" />
      <PublishPanel />
      <EditorActions />
    </aside>

    <!-- 右侧实时预览画布 75%（AC-1.1） -->
    <main class="preview">
      <MultiSelectBar />
      <CanvasStage
        :elements="curPage.elements"
        :theme-id="site.draft.theme"
        :motion-level="site.motion.level"
        :page-height="curPage.pageHeight"
        :interactive="true"
        :selected-id="selectedId"
        :selected-ids="selectedIds"
        :snap="snap"
        :align-guides="alignGuides"
        @select="onSelect"
        @move="onMove"
        @move-many="onMoveMany"
        @boxselect="onBoxSelect"
        @commit="dragging = false"
      />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import CanvasStage from '../components/CanvasStage.vue'
import EditorActions from '../components/EditorActions.vue'
import PublishPanel from '../components/PublishPanel.vue'
import PropsPanel from '../components/PropsPanel.vue'
import LayerPanel from '../components/LayerPanel.vue'
import TemplateLibrary from '../components/TemplateLibrary.vue'
import MultiSelectBar from '../components/MultiSelectBar.vue'
import CanvasSettings from '../components/CanvasSettings.vue'
import { useDevice } from '../composables/useDevice.js'
import { useEditorHotkeys } from '../composables/useEditorHotkeys.js'
import { PAGE_KEYS, DEFAULT_PAGE_NAMES } from '../core/pages.js'
import {
  site, selectedId, selectedIds, currentPage,
  initSite, pushHistory, addElement, updateElement,
  setCurrentPage, toggleSelection, setBoxSelection,
  dragSelectedTo,
} from '../store/site.js'

/** AC-16.1 十一类元素 */
const TYPES = [
  { id: 'text', label: '文本' },
  { id: 'image', label: '图片' },
  { id: 'video', label: '视频' },
  { id: 'link', label: '链接卡片' },
  { id: 'skillTag', label: '技能标签' },
  { id: 'gallery', label: '相册' },
  { id: 'decoration', label: '装饰' },
  { id: 'timeline', label: '时间线' },
  { id: 'skillMatrix', label: '技能矩阵' },
  { id: 'honors', label: '荣誉证书' },
  { id: 'contactCard', label: '联系卡片' },
]

const snap = ref(true)
const alignGuides = ref(true)
const dragging = ref(false)
const { device } = useDevice()

const curPage = computed(
  () => site.draft.pages.find((p) => p.key === currentPage.value) ?? site.draft.pages[0],
)

onMounted(() => {
  initSite()
})
useEditorHotkeys()

// AC-17.4 点选（Shift 加选）/ 框选
function onSelect(id, additive) {
  toggleSelection(id, additive)
}
function onBoxSelect(box) {
  setBoxSelection(box)
}

// 拖拽：首帧压栈记录拖拽前状态，落点由 commit 结束（AC-2.3）
function beginDrag() {
  if (!dragging.value) {
    pushHistory()
    dragging.value = true
  }
}
function onMove(patch) {
  beginDrag()
  updateElement(patch.id, { x: patch.x, y: patch.y })
}
function onMoveMany(patch) {
  beginDrag()
  dragSelectedTo(patch.id, patch.x, patch.y)
}
</script>

<style scoped>
.editor-page { display: flex; width: 100%; height: 100vh; }
.panel {
  width: 25%; min-width: 260px; overflow-y: auto; padding: 14px;
  background: var(--bg); border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex; flex-direction: column; gap: 14px;
}
.brand { font-size: 16px; color: var(--primary); }
.group h2 { font-size: 13px; opacity: 0.6; margin-bottom: 8px; }
.btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
button {
  padding: 6px 8px; border: 1px solid var(--primary); border-radius: var(--radius);
  background: transparent; color: var(--fg); font-size: 13px;
}
button:hover { background: var(--primary); color: #fff; }
button.on { background: var(--primary); color: #fff; }
.preview { width: 75%; overflow-y: auto; position: relative; }

/* AC-11.5 窄屏提示 */
.narrow-tip {
  width: 100%; min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; background: var(--bg);
}
.tip-card {
  max-width: 420px; text-align: center; padding: 32px 24px;
  border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
}
.tip-icon { font-size: 40px; margin-bottom: 12px; }
.tip-card h2 { color: var(--primary); font-size: 18px; margin-bottom: 14px; }
.tip-card p { font-size: 13px; line-height: 1.8; opacity: 0.75; margin-bottom: 10px; }
.tip-card a { display: inline-block; margin-top: 10px; color: var(--primary); font-size: 13px; text-decoration: none; }
</style>
