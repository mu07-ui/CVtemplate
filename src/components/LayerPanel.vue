<script setup>
/**
 * 图层面板（AC-17.1）：列表 / 选中同步 / 显隐 / 锁定 / 改名 / 层级
 * 列表顺序 = 当前页元素顺序（z 升序，底→顶）
 */
import { computed } from 'vue'
import {
  site, currentPage, selectedIds,
  toggleSelection, toggleVisible, toggleLocked, renameElement, moveElementLayer, pushHistory,
} from '../store/site.js'

const page = computed(() => site.draft.pages.find((p) => p.key === currentPage.value))
const layers = computed(() => page.value?.elements ?? [])

function selectLayer(id) {
  toggleSelection(id, false)
}

function onNameInput(id, e) {
  renameElement(id, e.target.value)
}

/** 改名失焦时压栈，避免逐字符刷历史栈 */
function commitName() {
  pushHistory()
}
</script>

<template>
  <div class="layer-panel">
    <div v-if="layers.length === 0" class="layer-empty">当前页暂无元素</div>
    <div
      v-for="el in layers"
      :key="el.id"
      class="layer-item"
      :class="{ active: selectedIds.includes(el.id) }"
      @click="selectLayer(el.id)"
    >
      <input
        class="layer-name"
        :value="el.name"
        @input="onNameInput(el.id, $event)"
        @change="commitName"
        @click.stop
      />
      <button
        class="btn-visible"
        :title="el.visible ? '隐藏' : '显示'"
        @click.stop="toggleVisible(el.id)"
      >{{ el.visible ? '👁' : '—' }}</button>
      <button
        class="btn-lock"
        :title="el.locked ? '解锁' : '锁定'"
        @click.stop="toggleLocked(el.id)"
      >{{ el.locked ? '🔒' : '🔓' }}</button>
      <button class="btn-up" title="上移一层" @click.stop="moveElementLayer(el.id, 'up')">↑</button>
      <button class="btn-down" title="下移一层" @click.stop="moveElementLayer(el.id, 'down')">↓</button>
    </div>
  </div>
</template>

<style scoped>
.layer-panel { display: flex; flex-direction: column; gap: 4px; }
.layer-empty { color: #8fa3c8; font-size: 12px; padding: 8px 0; }
.layer-item {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 6px; border-radius: 6px; background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
}
.layer-item.active { background: rgba(56, 189, 248, 0.18); outline: 1px solid rgba(56, 189, 248, 0.5); }
.layer-name {
  flex: 1; min-width: 0; background: transparent; border: none; outline: none;
  color: #dbe7ff; font-size: 12px; padding: 2px 0;
}
.layer-item button {
  border: none; background: transparent; color: #9db2d6; cursor: pointer;
  font-size: 12px; padding: 2px 4px; border-radius: 4px;
}
.layer-item button:hover { background: rgba(255, 255, 255, 0.08); color: #eaf2ff; }
</style>
