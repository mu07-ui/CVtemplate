<script setup>
/**
 * 画布设置：网格吸附 / 智能对齐线开关（AC-17.2）/ 页高 / 主题 / 动效档
 */
import { site, currentPage, setTheme, setPageHeight, setMotion, resetToSample } from '../store/site.js'
import { computed } from 'vue'

defineProps({
  snap: { type: Boolean, default: true },
  alignGuides: { type: Boolean, default: true },
})
const emit = defineEmits(['update:snap', 'update:alignGuides'])

const curPage = computed(
  () => site.draft.pages.find((p) => p.key === currentPage.value) ?? site.draft.pages[0],
)
</script>

<template>
  <section class="group">
    <h2>画布</h2>
    <label class="row">
      <input type="checkbox" :checked="snap" @change="emit('update:snap', $event.target.checked)" /> 网格吸附
    </label>
    <label class="row">
      <input type="checkbox" :checked="alignGuides" @change="emit('update:alignGuides', $event.target.checked)" /> 智能对齐线
    </label>
    <label>
      当前页页高（vh，100~500）
      <input type="number" min="100" max="500" :value="curPage.pageHeight"
        @change="setPageHeight($event.target.value)" />
    </label>
    <label>
      主题
      <select :value="site.draft.theme" @change="setTheme($event.target.value)">
        <option value="business">曜蓝商务</option>
        <option value="glass">星穹玻璃拟态</option>
        <option value="neon">暗夜霓虹</option>
        <option value="morning">极简晨白</option>
        <option value="pixel">复古像素</option>
      </select>
    </label>
    <label>
      动效档位
      <select :value="site.motion.level" @change="setMotion($event.target.value)">
        <option value="quiet">节能</option>
        <option value="standard">标准</option>
        <option value="rich">沉浸</option>
      </select>
    </label>
    <button @click="resetToSample()">恢复官网式示例内容</button>
  </section>
</template>

<style scoped>
.group h2 { font-size: 13px; opacity: 0.6; margin-bottom: 8px; }
label { display: block; font-size: 13px; margin-bottom: 8px; }
input, select { width: 100%; margin-top: 4px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; }
input[type='checkbox'] { width: auto; }
.row { display: flex; align-items: center; gap: 6px; }
button {
  padding: 6px 8px; border: 1px solid var(--primary); border-radius: var(--radius);
  background: transparent; color: var(--fg); font-size: 13px;
}
button:hover { background: var(--primary); color: #fff; }
</style>
