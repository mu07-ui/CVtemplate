<template>
  <section class="group">
    <h2>属性</h2>
    <template v-if="selected">
      <label v-if="selected.type === 'text'">
        中文内容
        <textarea :value="biVal('content').zh" @input="setPropBi('content', 'zh', $event.target.value)"></textarea>
      </label>
      <label v-if="selected.type === 'text'">
        英文内容（选填）
        <textarea :value="biVal('content').en" @input="setPropBi('content', 'en', $event.target.value)"></textarea>
      </label>
      <label v-if="selected.type === 'text'">
        字号 <input type="number" :value="selected.props.fontSize" @input="setProp('fontSize', +$event.target.value)" />
      </label>
      <label v-if="selected.type === 'text'">
        对齐
        <select :value="selected.props.align ?? 'left'" @change="setProp('align', $event.target.value)">
          <option value="left">左对齐</option>
          <option value="center">居中</option>
          <option value="right">右对齐</option>
        </select>
      </label>
      <label v-if="selected.type === 'text'">
        字重
        <select :value="selected.props.weight ?? 400" @change="setProp('weight', +$event.target.value)">
          <option :value="400">常规</option>
          <option :value="500">中等</option>
          <option :value="700">加粗</option>
        </select>
      </label>
      <label v-if="['text', 'decoration'].includes(selected.type)">
        颜色 <input type="color" :value="selected.props.color" @input="setProp('color', $event.target.value)" />
      </label>
      <label v-if="selected.type === 'decoration'">
        透明度
        <input type="range" min="0" max="1" step="0.05" :value="selected.props.opacity" @input="setProp('opacity', +$event.target.value)" />
      </label>

      <template v-if="selected.type === 'image'">
        <label>图片地址 <input :value="selected.props.src" @input="setProp('src', $event.target.value)" /></label>
        <button @click="pickFile('src')">本地上传图片</button>
      </template>

      <template v-if="selected.type === 'video'">
        <label>
          来源
          <select :value="selected.props.source" @change="setProp('source', $event.target.value)">
            <option value="link">外链嵌入</option>
            <option value="upload">本地上传</option>
          </select>
        </label>
        <label v-if="selected.props.source === 'link'">
          视频链接（B站/YouTube）
          <input :value="selected.props.url" @input="setProp('url', $event.target.value)" />
        </label>
        <button v-if="selected.props.source === 'upload'" @click="pickFile('src')">本地上传视频</button>
      </template>

      <template v-if="selected.type === 'link'">
        <label>中文标题 <input :value="biVal('title').zh" @input="setPropBi('title', 'zh', $event.target.value)" /></label>
        <label>
          英文标题（选填）
          <input placeholder="英文标题（选填）" :value="biVal('title').en" @input="setPropBi('title', 'en', $event.target.value)" />
        </label>
        <label>地址 <input :value="selected.props.url" @input="setProp('url', $event.target.value)" /></label>
      </template>

      <label v-if="selected.type === 'skillTag'">
        标签（英文逗号分隔）
        <input
          :value="selected.props.tags.join(',')"
          @change="setProp('tags', $event.target.value.split(',').map(s => s.trim()).filter(Boolean))"
        />
      </label>

      <template v-if="selected.type === 'gallery'">
        <div v-for="(img, i) in selected.props.images" :key="i" class="gal-row">
          <input :value="biText(img.caption)" placeholder="作品说明" @input="setGallery(i, 'caption', $event.target.value)" />
          <button @click="pickGalleryFile(i)">传图</button>
          <button @click="removeGallery(i)">删</button>
        </div>
        <button @click="addGallery">添加图片</button>
      </template>

      <!-- AC-16.1 结构化元素条目编辑 -->
      <StructuredProps v-if="structuredTypes.includes(selected.type)" :el="selected" />

      <!-- AC-16.2/16.3/16.4 美化 -->
      <BeautifyPanel :el="selected" />

      <!-- 位置与尺寸（百分比，AC-2.1） -->
      <div class="geo-grid">
        <label>X <input type="number" min="0" max="100" step="0.1" :value="selected.x" @change="setGeo('x', $event.target.value)" /></label>
        <label>Y <input type="number" min="0" max="100" step="0.1" :value="selected.y" @change="setGeo('y', $event.target.value)" /></label>
        <label>宽 <input type="number" min="0" max="100" step="0.1" :value="selected.w" @change="setGeo('w', $event.target.value)" /></label>
        <label>高 <input type="number" min="0" max="100" step="0.1" :value="selected.h" @change="setGeo('h', $event.target.value)" /></label>
      </div>

      <div class="layer-row">
        <button @click="moveElementLayer(selected.id, 'up')">上移</button>
        <button @click="moveElementLayer(selected.id, 'down')">下移</button>
        <button @click="moveElementLayer(selected.id, 'top')">置顶</button>
        <button @click="moveElementLayer(selected.id, 'bottom')">置底</button>
        <button @click="duplicateElement(selected.id)">复制</button>
        <button class="danger" @click="removeElement(selected.id)">删除</button>
      </div>
    </template>
    <p v-else class="hint">点击画布中的元素进行编辑</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import BeautifyPanel from './BeautifyPanel.vue'
import StructuredProps from './StructuredProps.vue'
import { toBi } from '../core/i18n.js'
import {
  site, selectedId,
  pushHistory, updateElement, removeElement, duplicateElement, moveElementLayer,
} from '../store/site.js'

const structuredTypes = ['timeline', 'skillMatrix', 'honors', 'contactCard']

// 跨页查找选中元素（属性面板跟随选中项，不随页签切换丢失）
const selected = computed(
  () => site.draft.pages.flatMap((p) => p.elements).find((e) => e.id === selectedId.value) ?? null,
)

/** 双语字段视图（旧数据字符串自动归一化，AC-12.4） */
function biVal(key) {
  return toBi(selected.value?.props?.[key])
}
const biText = (v) => toBi(v).zh

function setProp(key, value) {
  pushHistory()
  updateElement(selected.value.id, { props: { ...selected.value.props, [key]: value } })
}

/** 更新双语字段指定语言，另一语言保留（AC-12.4） */
function setPropBi(key, lang, value) {
  pushHistory()
  const next = { ...toBi(selected.value.props[key]), [lang]: value }
  updateElement(selected.value.id, { props: { ...selected.value.props, [key]: next } })
}

function pickFile(prop) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = selected.value.type === 'video' ? 'video/*' : 'image/*'
  input.onchange = () => fileToDataUrl(input.files[0]).then((url) => setProp(prop, url))
  input.click()
}

function pickGalleryFile(i) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => fileToDataUrl(input.files[0]).then((url) => setGallery(i, 'src', url))
  input.click()
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function setGallery(i, key, value) {
  const images = selected.value.props.images.map((img, idx) => {
    if (idx !== i) return img
    const next = key === 'caption' ? { ...toBi(img.caption), zh: value } : value
    return { ...img, [key]: next }
  })
  setProp('images', images)
}
function addGallery() {
  setProp('images', [...selected.value.props.images, { src: '', caption: '' }])
}
function removeGallery(i) {
  setProp('images', selected.value.props.images.filter((_, idx) => idx !== i))
}

function setGeo(key, value) {
  const v = Math.min(100, Math.max(0, Number(value) || 0))
  pushHistory()
  updateElement(selected.value.id, { [key]: v })
}
</script>

<style scoped>
.group h2 { font-size: 13px; opacity: 0.6; margin-bottom: 8px; }
button {
  padding: 6px 8px; border: 1px solid var(--primary); border-radius: var(--radius);
  background: transparent; color: var(--fg); font-size: 13px;
}
button:hover { background: var(--primary); color: #fff; }
button.danger { border-color: #e45858; color: #e45858; }
label { display: block; font-size: 13px; margin-bottom: 8px; }
input, select, textarea { width: 100%; margin-top: 4px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; }
textarea { min-height: 60px; resize: vertical; }
.layer-row { display: flex; gap: 4px; flex-wrap: wrap; }
.geo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.gal-row { display: flex; gap: 4px; margin-bottom: 4px; }
.gal-row input { flex: 1; }
.hint { font-size: 12px; opacity: 0.5; }
</style>
