<template>
  <router-view />
</template>

<script setup>
import { applyTheme } from './core/theme.js'
// 默认主题变量，防止首帧无样式
applyTheme('business')
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; }
body {
  background: var(--bg, #f5f6f8);
  color: var(--fg, #2b2f36);
  font-family: var(--font, sans-serif);
}
button { cursor: pointer; font-family: inherit; }
input, select, textarea { font-family: inherit; }
</style>
