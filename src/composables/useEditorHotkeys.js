import { computed, onBeforeUnmount, onMounted } from 'vue'
import {
  site, selectedId, selectedIds, undo, redo,
  duplicateElement, removeElement, updateElement, removeSelected,
} from '../store/site.js'

/**
 * 编辑器全局快捷键（AC-5.3）：Delete/Backspace 删除、多选批量删除（AC-17.4）、
 * 方向键微调（Shift 大步长）、Ctrl+D 复制、Ctrl+Z / Ctrl+Shift+Z 撤销重做。
 * 焦点在输入框/文本域/下拉框/可编辑区时不触发（含中文输入法组合态），
 * 避免在属性面板打字时误删或误移元素（缺陷回归：tests/history.test.js AC-5.3）。
 */
export function useEditorHotkeys() {
  const selected = computed(
    () => site.draft.pages.flatMap((p) => p.elements).find((e) => e.id === selectedId.value) ?? null,
  )

  function isTypingTarget(t) {
    if (!t || !t.tagName) return false
    const tag = String(t.tagName).toLowerCase()
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable === true
  }

  function onKey(e) {
    if (e.isComposing || isTypingTarget(e.target)) return
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
    // 多选优先批量删除（AC-17.4）
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.value.length > 1) {
      e.preventDefault()
      removeSelected()
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

  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
}
