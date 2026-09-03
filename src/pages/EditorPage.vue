<template>
  <div class="editor-page">
    <!-- 左侧编辑面板 25%（AC-1.1） -->
    <aside class="panel">
      <h1 class="brand">作品集编辑器</h1>

      <section class="group">
        <h2>添加元素</h2>
        <div class="btn-grid">
          <button v-for="t in TYPES" :key="t.id" @click="addElement(t.id)">{{ t.label }}</button>
        </div>
      </section>

      <section class="group">
        <h2>属性</h2>
        <template v-if="selected">
          <label v-if="selected.type === 'text'">
            内容
            <textarea :value="selected.props.content" @input="setProp('content', $event.target.value)"></textarea>
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
            <label>标题 <input :value="selected.props.title" @input="setProp('title', $event.target.value)" /></label>
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
              <input :value="img.caption" placeholder="作品说明" @input="setGallery(i, 'caption', $event.target.value)" />
              <button @click="pickGalleryFile(i)">传图</button>
              <button @click="removeGallery(i)">删</button>
            </div>
            <button @click="addGallery">添加图片</button>
          </template>

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
            <button class="danger" @click="removeElement(selected.id)">删除</button>
          </div>
        </template>
        <p v-else class="hint">点击画布中的元素进行编辑</p>
      </section>

      <section class="group">
        <h2>画布</h2>
        <label class="row">
          <input type="checkbox" v-model="snap" /> 网格吸附
        </label>
        <label>
          页面总高（vh，100~500）
          <input
            type="number"
            min="100"
            max="500"
            :value="site.pageHeight ?? 100"
            @change="setPageHeight($event.target.value)"
          />
        </label>
        <label>
          主题
          <select :value="site.theme" @change="setTheme($event.target.value)">
            <option value="business">商务稳重</option>
            <option value="glass">玻璃拟态</option>
            <option value="pixel">复古像素</option>
          </select>
        </label>
        <button @click="resetToSample()">恢复官网式示例内容</button>
      </section>

      <section class="group">
        <h2>操作</h2>
        <div class="btn-grid">
          <button :disabled="!canUndo" @click="undo()">撤销</button>
          <button :disabled="!canRedo" @click="redo()">重做</button>
          <button @click="onExport">导出 JSON</button>
          <button @click="fileInput.click()">导入 JSON</button>
          <button :disabled="exporting" @click="onExportZip">导出静态站</button>
          <button @click="onExportPdf">导出 PDF 简历</button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="application/json"
          hidden
          @change="onImport"
        />
      </section>
    </aside>

    <!-- 右侧实时预览画布 75%（AC-1.1） -->
    <main class="preview">
      <CanvasStage
        :elements="site.elements"
        :theme-id="site.theme"
        :page-height="site.pageHeight ?? 100"
        :interactive="true"
        :selected-id="selectedId"
        :snap="snap"
        @select="selectedId = $event"
        @move="onMove"
        @commit="dragging = false"
      />
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CanvasStage from '../components/CanvasStage.vue'
import { ELEMENT_TYPES } from '../core/schema.js'
import {
  site, selectedId, canUndo, canRedo,
  initSite, pushHistory, undo, redo,
  addElement, removeElement, duplicateElement, updateElement, moveElementLayer,
  setTheme, setPageHeight, resetToSample, exportSiteJson, importSiteJson,
} from '../store/site.js'
import { buildSiteZip } from '../core/exportSite.js'
import { buildResumeHtml } from '../core/resume.js'

const TYPES = [
  { id: 'text', label: '文本' },
  { id: 'image', label: '图片' },
  { id: 'video', label: '视频' },
  { id: 'link', label: '链接卡片' },
  { id: 'skillTag', label: '技能标签' },
  { id: 'gallery', label: '相册' },
  { id: 'decoration', label: '装饰' },
]

const snap = ref(true)
const dragging = ref(false)
const fileInput = ref(null)
const selected = computed(() => site.elements.find((e) => e.id === selectedId.value) ?? null)

onMounted(() => {
  initSite()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function setProp(key, value) {
  pushHistory()
  updateElement(selected.value.id, { props: { ...selected.value.props, [key]: value } })
}

// 拖拽：首帧压栈记录拖拽前状态，落点由 commit 结束（AC-2.3）
function onMove(patch) {
  if (!dragging.value) {
    pushHistory()
    dragging.value = true
  }
  updateElement(patch.id, { x: patch.x, y: patch.y })
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
  const images = selected.value.props.images.map((img, idx) => (idx === i ? { ...img, [key]: value } : img))
  setProp('images', images)
}
function addGallery() {
  setProp('images', [...selected.value.props.images, { src: '', caption: '' }])
}
function removeGallery(i) {
  setProp('images', selected.value.props.images.filter((_, idx) => idx !== i))
}

// 快捷键（AC-5.3）：Delete 删除、方向键微调、Ctrl+D 复制、Ctrl+Z 撤销
function onKey(e) {
  const mod = e.ctrlKey || e.metaKey
  if (mod && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    e.shiftKey ? redo() : undo()
    return
  }
  if (mod && e.key.toLowerCase() === 'd' && selected.value) {
    e.preventDefault()
    duplicateElement(selected.value.id)
    return
  }
  if (!selected.value) return
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    removeElement(selected.value.id)
    return
  }
  const step = e.shiftKey ? 1 : 0.1
  const dir = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }[e.key]
  if (dir) {
    e.preventDefault()
    updateElement(selected.value.id, {
      x: Math.min(100, Math.max(0, selected.value.x + dir[0])),
      y: Math.min(100, Math.max(0, selected.value.y + dir[1])),
    })
  }
}

function onExport() {
  downloadBlob(new Blob([exportSiteJson()], { type: 'application/json' }), 'portfolio-data.json')
}

// 位置/尺寸数值输入（AC-2.1 百分比）
function setGeo(key, value) {
  const v = Math.min(100, Math.max(0, Number(value) || 0))
  pushHistory()
  updateElement(selected.value.id, { [key]: v })
}

// 静态站 ZIP（AC-6.5）：解压后可直接部署或双击 index.html 离线浏览
const exporting = ref(false)
async function onExportZip() {
  exporting.value = true
  try {
    const blob = await buildSiteZip(site)
    downloadBlob(blob, 'portfolio-site.zip')
  } catch (err) {
    alert(`导出失败：${err.message}`)
  } finally {
    exporting.value = false
  }
}

// PDF 简历（AC-6.6）：打开独立 A4 模板窗口，自动唤起打印（另存为 PDF）
function onExportPdf() {
  const w = window.open('', '_blank')
  if (!w) {
    alert('浏览器拦截了弹出窗口，请允许弹出窗口后重试')
    return
  }
  w.document.write(buildResumeHtml(site))
  w.document.close()
}

function downloadBlob(blob, name) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

function onImport(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  file.text().then((text) => {
    try {
      importSiteJson(text)
    } catch (err) {
      alert(err.message) // 中文错误提示（AC-6.4）
    }
  })
}
</script>

<style scoped>
.editor-page { display: flex; width: 100%; height: 100vh; }
.panel {
  width: 25%; min-width: 260px; overflow-y: auto; padding: 14px;
  background: var(--bg); border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex; flex-direction: column; gap: 14px;
}
.brand { font-size: 16px; color: var(--primary); }
.group h2 { font-size: 13px; opacity: 0.6; margin-bottom: 8px; }
.btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
button {
  padding: 6px 8px; border: 1px solid var(--primary); border-radius: var(--radius);
  background: transparent; color: var(--fg); font-size: 13px;
}
button:hover:not(:disabled) { background: var(--primary); color: #fff; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
button.danger { border-color: #e45858; color: #e45858; }
label { display: block; font-size: 13px; margin-bottom: 8px; }
input, select, textarea { width: 100%; margin-top: 4px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; }
input[type='checkbox'], input[type='color'], input[type='range'] { width: auto; }
.row { display: flex; align-items: center; gap: 6px; }
textarea { min-height: 60px; resize: vertical; }
.layer-row { display: flex; gap: 4px; flex-wrap: wrap; }
.geo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.gal-row { display: flex; gap: 4px; margin-bottom: 4px; }
.gal-row input { flex: 1; }
.hint { font-size: 12px; opacity: 0.5; }
.preview { width: 75%; overflow-y: auto; }
</style>
