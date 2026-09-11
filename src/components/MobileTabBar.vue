<template>
  <nav class="tab-bar">
    <a
      v-for="p in pages"
      :key="p.key"
      :href="'#' + p.path"
      class="tab-item"
      :class="{ active: pageKey === p.key }"
    >{{ pickText(p.name, locale) }}</a>
    <div class="tab-lang">
      <button :class="{ active: locale === 'zh' }" @click="setLocale('zh')">中</button>
      <button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
    </div>
  </nav>
</template>

<script setup>
/**
 * 手机端固定底部标签栏（AC-11.2）：四页四 tab，当前页高亮
 * hash 链接直出，组件不依赖 router 实例
 */
import { computed } from 'vue'
import { site, setLocale } from '../store/site.js'
import { pickText } from '../core/i18n.js'
import { PAGE_KEYS, DEFAULT_PAGE_NAMES } from '../core/pages.js'

defineProps({ pageKey: { type: String, default: 'home' } })
const locale = computed(() => site.locale)
const pages = PAGE_KEYS.map((key) => ({
  key,
  name: DEFAULT_PAGE_NAMES[key],
  path: key === 'home' ? '/' : `/${key}`,
}))
</script>

<style scoped>
.tab-bar {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 100;
  display: flex; align-items: stretch;
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom, 0px));
  background: rgba(10, 15, 30, 0.72);
  backdrop-filter: blur(18px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.tab-item {
  flex: 1; text-align: center; padding: 8px 2px;
  font-size: 12px; letter-spacing: 0.04em;
  color: var(--fg); text-decoration: none; opacity: 0.62;
  border-radius: 8px;
}
.tab-item.active { opacity: 1; color: var(--primary); background: rgba(56, 189, 248, 0.12); }
.tab-lang { display: flex; gap: 4px; align-items: center; padding-left: 4px; }
.tab-lang button {
  border: 1px solid rgba(255, 255, 255, 0.16); background: transparent; color: var(--fg);
  border-radius: 999px; font-size: 11px; padding: 3px 8px; opacity: 0.7;
}
.tab-lang button.active { border-color: var(--primary); color: var(--primary); opacity: 1; }
</style>
