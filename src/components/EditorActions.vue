<template>
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
    <input ref="fileInput" type="file" accept="application/json" hidden @change="onImport" />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { site, canUndo, canRedo, undo, redo, exportSiteJson, importSiteJson } from '../store/site.js'
import { buildSiteZip } from '../core/exportSite.js'
import { buildResumeHtml } from '../core/resume.js'

const fileInput = ref(null)

function onExport() {
  downloadBlob(new Blob([exportSiteJson()], { type: 'application/json' }), 'portfolio-data.json')
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
.btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
button {
  padding: 6px 8px; border: 1px solid var(--primary); border-radius: var(--radius);
  background: transparent; color: var(--fg); font-size: 13px;
}
button:hover:not(:disabled) { background: var(--primary); color: #fff; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
.group h2 { font-size: 13px; opacity: 0.6; margin-bottom: 8px; }
</style>
