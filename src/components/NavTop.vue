<template>
  <nav class="nav-top">
    <a
      v-for="p in pages"
      :key="p.key"
      :href="'#' + p.path"
      class="nav-link"
      :class="{ active: pageKey === p.key }"
    >{{ pickText(p.name, locale) }}</a>

    <div class="lang-switch">
      <button :class="{ active: locale === 'zh' }" @click="setLocale('zh')">中文</button>
      <button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { site, setLocale } from '../store/site.js'
import { pickText } from '../core/i18n.js'
import { PAGE_KEYS, DEFAULT_PAGE_NAMES } from '../core/pages.js'

// 高亮页由父级（ShowcasePage / 路由）传入，组件自身不依赖 router 实例
const props = defineProps({ pageKey: { type: String, default: 'home' } })
const locale = computed(() => site.locale)

const pages = PAGE_KEYS.map((key) => ({
  key,
  name: DEFAULT_PAGE_NAMES[key],
  path: key === 'home' ? '/' : `/${key}`,
}))
</script>

<style scoped>
.nav-top {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 32px;
  background: rgba(10, 15, 30, 0.42);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.nav-link {
  font-size: 14px;
  letter-spacing: 0.04em;
  color: var(--fg);
  text-decoration: none;
  opacity: 0.62;
  transition: opacity 0.2s;
}
.nav-link:hover, .nav-link.active { opacity: 1; }
.nav-link.active { color: var(--primary); }

.lang-switch { margin-left: auto; display: flex; gap: 6px; }
.lang-switch button {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: transparent;
  color: var(--fg);
  font-size: 12px;
  opacity: 0.7;
  cursor: pointer;
  transition: all 0.2s;
}
.lang-switch button.active {
  border-color: var(--primary);
  color: var(--primary);
  opacity: 1;
}
@media (max-width: 640px) {
  .nav-top { gap: 14px; padding: 10px 16px; }
}
</style>
