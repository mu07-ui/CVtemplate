<script setup>
/**
 * 区块模板库（AC-17.3）：≥8 组排版模板，一键插入当前页，元素 id 重新生成
 */
import { TEMPLATE_KEYS, TEMPLATES } from '../core/templates.js'
import { insertTemplate } from '../store/site.js'

function use(key) {
  insertTemplate(key)
}
</script>

<template>
  <div class="tpl-library">
    <button
      v-for="key in TEMPLATE_KEYS"
      :key="key"
      class="tpl-btn"
      @click="use(key)"
    >＋ {{ TEMPLATES[key].label }}</button>
  </div>
</template>

<style scoped>
.tpl-library { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.tpl-btn {
  padding: 8px 6px; border-radius: 8px; cursor: pointer;
  background: rgba(56, 189, 248, 0.12); color: #cfe6ff;
  border: 1px solid rgba(56, 189, 248, 0.35);
  font-size: 12px; text-align: center;
}
.tpl-btn:hover { background: rgba(56, 189, 248, 0.24); }
</style>
