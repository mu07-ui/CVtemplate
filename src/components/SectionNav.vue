<template>
  <nav v-if="sections.length" class="sec-nav" aria-label="分区导航">
    <button
      class="sec-prev"
      :disabled="active <= 0"
      aria-label="上一页"
      @click="$emit('goto', active - 1)"
    >←</button>
    <button
      v-for="(s, i) in sections"
      :key="i"
      class="sec-num"
      :class="{ active: i === active }"
      :title="s.name"
      @click="$emit('goto', i)"
    >
      <span class="sec-idx">{{ i + 1 }}</span>
      <span class="sec-name">{{ s.name }}</span>
    </button>
    <button
      class="sec-next"
      :disabled="active >= sections.length - 1"
      aria-label="下一页"
      @click="$emit('goto', active + 1)"
    >→</button>
  </nav>
</template>

<script setup>
defineProps({
  // 已规范化的分区列表 [{ name, y }]（画布百分比）
  sections: { type: Array, default: () => [] },
  active: { type: Number, default: 0 },
})
defineEmits(['goto'])
</script>

<style scoped>
/* 固定右侧的分页导航（官网式） */
.sec-nav {
  position: fixed; right: 20px; top: 50%; transform: translateY(-50%);
  z-index: 999; display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
}
.sec-nav button {
  display: flex; align-items: center; gap: 8px; justify-content: flex-end;
  padding: 6px 10px; border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
  border-radius: 999px; background: color-mix(in srgb, var(--bg) 55%, transparent);
  backdrop-filter: blur(12px); color: var(--fg); font-size: 12px; letter-spacing: 0.05em;
  cursor: pointer; transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.sec-nav button:hover:not(:disabled) { border-color: var(--primary); }
.sec-nav button:disabled { opacity: 0.35; cursor: not-allowed; }
.sec-name { opacity: 0.7; }
.sec-num.active {
  border-color: var(--primary);
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 14%, transparent);
}
.sec-num.active .sec-name { opacity: 1; }

/* 响应式（AC-9.4）：窄屏紧凑模式，仅页码，无横向滚动 */
@media (max-width: 640px) {
  .sec-nav { right: 10px; gap: 7px; }
  .sec-name { display: none; }
  .sec-nav button { padding: 4px 8px; font-size: 11px; }
}
</style>
