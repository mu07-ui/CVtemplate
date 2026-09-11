<script setup>
/**
 * 结构化元素条目编辑（AC-16.1）：时间线 / 技能矩阵 / 荣誉证书 / 联系卡片
 */
import { computed } from 'vue'
import { pushHistory, updateElement } from '../store/site.js'

const props = defineProps({ el: { type: Object, required: true } })
const items = computed(() => props.el.props.items ?? [])

function commit(next) {
  pushHistory()
  updateElement(props.el.id, { props: { ...props.el.props, items: next } })
}
function patch(i, p) {
  commit(items.value.map((it, idx) => (idx === i ? { ...it, ...p } : it)))
}
function patchBi(i, key, lang, value) {
  commit(items.value.map((it, idx) =>
    idx === i ? { ...it, [key]: { zh: it[key]?.zh ?? '', en: it[key]?.en ?? '', [lang]: value } } : it))
}
function remove(i) {
  commit(items.value.filter((_, idx) => idx !== i))
}

const blank = {
  timeline: { date: '2025', title: { zh: '标题', en: '' }, desc: { zh: '描述', en: '' } },
  skillMatrix: { name: '新技能', level: 60 },
  honors: { title: { zh: '荣誉名称', en: '' }, issuer: '颁发机构', date: '2025', link: '' },
  contactCard: { label: { zh: '标签', en: '' }, value: '', href: '' },
}
function add() {
  commit([...items.value, JSON.parse(JSON.stringify(blank[props.el.type]))])
}
</script>

<template>
  <div class="structured-props">
    <!-- 时间线 -->
    <template v-if="el.type === 'timeline'">
      <div v-for="(it, i) in items" :key="i" class="item-card">
        <input :value="it.date" placeholder="时间" @input="patch(i, { date: $event.target.value })" />
        <input :value="it.title?.zh" placeholder="标题（中）" @input="patchBi(i, 'title', 'zh', $event.target.value)" />
        <input :value="it.title?.en" placeholder="标题（英）" @input="patchBi(i, 'title', 'en', $event.target.value)" />
        <textarea :value="it.desc?.zh" placeholder="描述（中）" @input="patchBi(i, 'desc', 'zh', $event.target.value)"></textarea>
        <button class="danger" @click="remove(i)">删除条目</button>
      </div>
    </template>

    <!-- 技能矩阵 -->
    <template v-else-if="el.type === 'skillMatrix'">
      <div v-for="(it, i) in items" :key="i" class="item-row">
        <input :value="it.name" placeholder="技能名" @input="patch(i, { name: $event.target.value })" />
        <input type="number" min="0" max="100" :value="it.level"
          @input="patch(i, { level: Math.min(100, Math.max(0, +$event.target.value || 0)) })" />
        <button class="danger" @click="remove(i)">删</button>
      </div>
    </template>

    <!-- 荣誉证书 -->
    <template v-else-if="el.type === 'honors'">
      <div v-for="(it, i) in items" :key="i" class="item-card">
        <input :value="it.title?.zh" placeholder="荣誉名称（中）" @input="patchBi(i, 'title', 'zh', $event.target.value)" />
        <input :value="it.title?.en" placeholder="荣誉名称（英）" @input="patchBi(i, 'title', 'en', $event.target.value)" />
        <input :value="it.issuer" placeholder="颁发机构" @input="patch(i, { issuer: $event.target.value })" />
        <input :value="it.date" placeholder="日期" @input="patch(i, { date: $event.target.value })" />
        <input :value="it.link" placeholder="链接（选填）" @input="patch(i, { link: $event.target.value })" />
        <button class="danger" @click="remove(i)">删除条目</button>
      </div>
    </template>

    <!-- 联系卡片 -->
    <template v-else-if="el.type === 'contactCard'">
      <div v-for="(it, i) in items" :key="i" class="item-card">
        <input :value="it.label?.zh" placeholder="标签（中）" @input="patchBi(i, 'label', 'zh', $event.target.value)" />
        <input :value="it.label?.en" placeholder="标签（英）" @input="patchBi(i, 'label', 'en', $event.target.value)" />
        <input :value="it.value" placeholder="显示内容" @input="patch(i, { value: $event.target.value })" />
        <input :value="it.href" placeholder="链接（mailto: / https://）" @input="patch(i, { href: $event.target.value })" />
        <button class="danger" @click="remove(i)">删除条目</button>
      </div>
    </template>

    <button class="add" @click="add">＋ 添加条目</button>
  </div>
</template>

<style scoped>
.structured-props { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.item-card { display: flex; flex-direction: column; gap: 4px; padding: 8px; border: 1px solid rgba(128,128,128,0.35); border-radius: 6px; }
.item-row { display: flex; gap: 4px; align-items: center; }
.item-row input:first-child { flex: 2; }
.item-row input[type='number'] { flex: 1; }
input, textarea { padding: 5px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; }
textarea { min-height: 40px; resize: vertical; }
button { padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; }
button.danger { border: 1px solid #e45858; color: #e45858; background: transparent; }
button.add { border: 1px dashed var(--primary); color: var(--primary); background: transparent; }
</style>
