<script setup>
/**
 * 结构化元素渲染（AC-16.1）：时间线 / 技能矩阵 / 荣誉证书 / 联系卡片
 * 纯展示；双语字段按当前语言取值
 */
import { computed } from 'vue'
import { pickText } from '../core/i18n.js'
import { site } from '../store/site.js'

const props = defineProps({ element: { type: Object, required: true } })
const el = computed(() => props.element)
const text = (v) => pickText(v, site.locale)
const items = computed(() => el.value.props.items ?? [])
</script>

<template>
  <div class="structured">
    <!-- 时间线 -->
    <ul v-if="el.type === 'timeline'" class="timeline">
      <li v-for="(it, i) in items" :key="i" class="tl-item">
        <div class="tl-dot"></div>
        <div class="tl-body">
          <span class="tl-date">{{ it.date }}</span>
          <span class="tl-title">{{ text(it.title) }}</span>
          <span class="tl-desc">{{ text(it.desc) }}</span>
        </div>
      </li>
    </ul>

    <!-- 技能矩阵 -->
    <div v-else-if="el.type === 'skillMatrix'" class="skills">
      <div v-for="(it, i) in items" :key="i" class="skill-row">
        <span class="skill-name">{{ it.name }}</span>
        <div class="skill-track"><div class="skill-fill" :style="{ width: `${Math.min(100, Math.max(0, it.level || 0))}%` }"></div></div>
        <span class="skill-level">{{ it.level }}</span>
      </div>
    </div>

    <!-- 荣誉证书 -->
    <ul v-else-if="el.type === 'honors'" class="honors">
      <li v-for="(it, i) in items" :key="i" class="honor-item">
        <span class="honor-title">{{ text(it.title) }}</span>
        <span class="honor-meta">{{ it.issuer }}<template v-if="it.date"> · {{ it.date }}</template></span>
        <a v-if="it.link" :href="it.link" target="_blank" rel="noopener" class="honor-link">查看 ↗</a>
      </li>
    </ul>

    <!-- 联系卡片 -->
    <div v-else-if="el.type === 'contactCard'" class="contacts">
      <a
        v-for="(it, i) in items"
        :key="i"
        class="contact-row"
        :href="it.href || undefined"
        :target="it.href ? '_blank' : undefined"
        rel="noopener"
      >
        <span class="contact-label">{{ text(it.label) }}</span>
        <span class="contact-value">{{ it.value }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.structured { width: 100%; height: 100%; overflow: auto; color: var(--fg); }
.timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.tl-item { display: flex; gap: 10px; position: relative; }
.tl-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--primary); margin-top: 5px; flex: none; box-shadow: 0 0 8px var(--primary); }
.tl-body { display: flex; flex-direction: column; gap: 2px; }
.tl-date { font-size: 12px; color: var(--primary); letter-spacing: 0.08em; }
.tl-title { font-size: 15px; font-weight: 600; }
.tl-desc { font-size: 13px; opacity: 0.7; }
.skills { display: flex; flex-direction: column; gap: 10px; }
.skill-row { display: flex; align-items: center; gap: 10px; }
.skill-name { width: 90px; flex: none; font-size: 13px; }
.skill-track { flex: 1; height: 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); overflow: hidden; }
.skill-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 55%, white)); }
.skill-level { width: 34px; text-align: right; font-size: 12px; opacity: 0.7; }
.honors { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.honor-item {
  display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
  padding: 8px 12px; border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.04); border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
}
.honor-title { font-weight: 600; font-size: 14px; }
.honor-meta { font-size: 12px; opacity: 0.6; }
.honor-link { margin-left: auto; font-size: 12px; color: var(--primary); text-decoration: none; }
.contacts { display: flex; flex-direction: column; gap: 8px; }
.contact-row {
  display: flex; gap: 14px; padding: 10px 14px; text-decoration: none;
  border-radius: var(--radius); color: var(--fg);
  background: rgba(255, 255, 255, 0.04); border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
}
.contact-row:hover { border-color: var(--primary); }
.contact-label { color: var(--primary); font-size: 13px; flex: none; }
.contact-value { font-size: 13px; opacity: 0.8; }
</style>
