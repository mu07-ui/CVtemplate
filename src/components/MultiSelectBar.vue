<script setup>
/**
 * 多选批量工具条（AC-17.4）：≥2 个选中时浮于画布顶部；批量对齐 / 删除
 */
import { computed } from 'vue'
import { selectedIds, alignSelected, removeSelected } from '../store/site.js'

const count = computed(() => selectedIds.value.length)

const aligns = [
  { id: 'left', label: '左对齐' },
  { id: 'hcenter', label: '水平居中' },
  { id: 'right', label: '右对齐' },
  { id: 'top', label: '顶对齐' },
  { id: 'vcenter', label: '垂直居中' },
  { id: 'bottom', label: '底对齐' },
]
</script>

<template>
  <div v-if="count >= 2" class="multi-bar">
    <span class="count">已选 {{ count }} 项</span>
    <button v-for="a in aligns" :key="a.id" @click="alignSelected(a.id)">{{ a.label }}</button>
    <button class="danger" @click="removeSelected">批量删除</button>
  </div>
</template>

<style scoped>
.multi-bar {
  position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
  z-index: 1000; display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 999px;
  background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(56, 189, 248, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
.count { color: #cfe6ff; font-size: 12px; margin-right: 4px; }
button {
  padding: 4px 10px; border-radius: 999px; font-size: 12px; cursor: pointer;
  background: rgba(56, 189, 248, 0.14); color: #cfe6ff; border: 1px solid rgba(56, 189, 248, 0.4);
}
button:hover { background: rgba(56, 189, 248, 0.3); }
button.danger { border-color: #e45858; color: #fca5a5; }
</style>
