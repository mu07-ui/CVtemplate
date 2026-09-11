<template>
  <section class="group">
    <h2>发布与快照</h2>

    <!-- 未发布改动提示 -->
    <div v-if="hasUnpublishedChanges()" class="badge warn">有未发布改动</div>
    <div v-else class="badge ok">草稿与线上一致</div>

    <button class="primary" @click="openPublish">发布到展示页</button>
    <button :disabled="!hasUnpublishedChanges()" @click="openRevert">还原草稿</button>

    <!-- 发布确认弹层（AC-13.2 / AC-13.4） -->
    <div v-if="showPublish" class="modal-backdrop" @click.self="closeAll">
      <div class="modal">
        <h3>发布到展示页</h3>
        <p v-if="hasUnpublishedChanges()" class="modal-warn">
          当前草稿有未发布改动，发布后将覆盖线上展示内容。
        </p>
        <label>
          发布备注（选填）
          <input
            ref="noteInput"
            v-model="publishNote"
            placeholder="如：新增项目页"
            @keyup.enter="confirmPublish"
          />
        </label>
        <div class="modal-actions">
          <button @click="closeAll">取消</button>
          <button class="primary" @click="confirmPublish">确认发布</button>
        </div>
      </div>
    </div>

    <!-- 还原二次确认（AC-13.4） -->
    <div v-if="showRevert" class="modal-backdrop" @click.self="closeAll">
      <div class="modal">
        <h3>还原草稿</h3>
        <p class="modal-warn">将放弃当前草稿的全部改动，回到最近一次发布状态。此操作可撤销。</p>
        <div class="modal-actions">
          <button @click="closeAll">取消</button>
          <button class="danger" @click="confirmRevert">确认还原</button>
        </div>
      </div>
    </div>

    <!-- 快照列表（AC-13.3） -->
    <div v-if="site.snapshots.length" class="snapshots">
      <h3>历史快照（{{ site.snapshots.length }}/{{ MAX }}）</h3>
      <ul>
        <li
          v-for="s in [...site.snapshots].reverse()"
          :key="s.id"
          :class="{ active: previewId === s.id }"
          @click="previewId = previewId === s.id ? null : s.id"
        >
          <div class="snap-meta">
            <span class="snap-note">{{ s.note || '（无备注）' }}</span>
            <span class="snap-time">{{ formatTime(s.time) }}</span>
          </div>
          <div v-if="previewId === s.id" class="snap-actions">
            <button @click.stop="rollback(s.id)">回滚到草稿</button>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import {
  site,
  hasUnpublishedChanges,
  publishDraft,
  revertDraft,
  restoreSnapshot,
} from '../store/site.js'
import { MAX_SNAPSHOTS } from '../core/snapshots.js'

const MAX = MAX_SNAPSHOTS
const showPublish = ref(false)
const showRevert = ref(false)
const publishNote = ref('')
const noteInput = ref(null)
const previewId = ref(null)

function openPublish() {
  publishNote.value = ''
  showPublish.value = true
  nextTick(() => noteInput.value?.focus())
}

function openRevert() {
  showRevert.value = true
}

function closeAll() {
  showPublish.value = false
  showRevert.value = false
}

function confirmPublish() {
  publishDraft(publishNote.value.trim())
  closeAll()
}

function confirmRevert() {
  revertDraft()
  closeAll()
}

function rollback(id) {
  restoreSnapshot(id)
  previewId.value = null
}

function formatTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.group h2 { font-size: 13px; opacity: 0.6; margin-bottom: 8px; }
.badge {
  display: inline-block; padding: 2px 8px; border-radius: 999px;
  font-size: 11px; margin-bottom: 8px;
}
.badge.warn { background: rgba(228, 88, 88, 0.18); color: #e45858; }
.badge.ok { background: rgba(34, 197, 94, 0.18); color: #22c55e; }

button {
  width: 100%; margin-bottom: 6px; padding: 8px;
  border: 1px solid var(--primary); border-radius: var(--radius);
  background: transparent; color: var(--fg); font-size: 13px; cursor: pointer;
}
button:hover:not(:disabled) { background: var(--primary); color: #fff; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
button.primary { background: var(--primary); color: #fff; }
button.danger { border-color: #e45858; color: #e45858; }
button.danger:hover { background: #e45858; color: #fff; }

.modal-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.modal {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 24px; min-width: 320px; max-width: 90vw;
}
.modal h3 { font-size: 16px; margin-bottom: 12px; }
.modal-warn { font-size: 13px; color: #fbbf24; margin-bottom: 12px; line-height: 1.5; }
.modal label { display: block; font-size: 12px; opacity: 0.7; margin-bottom: 12px; }
.modal input {
  width: 100%; margin-top: 4px; padding: 6px 8px;
  border: 1px solid var(--border); border-radius: var(--radius);
  background: rgba(0, 0, 0, 0.2); color: var(--fg); font-size: 13px;
}
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.modal-actions button { width: auto; margin: 0; padding: 6px 16px; }

.snapshots { margin-top: 12px; }
.snapshots h3 { font-size: 12px; opacity: 0.6; margin-bottom: 6px; }
.snapshots ul { list-style: none; padding: 0; max-height: 200px; overflow-y: auto; }
.snapshots li {
  padding: 6px 8px; border-radius: 6px; cursor: pointer;
  border: 1px solid transparent; transition: all 0.15s;
}
.snapshots li:hover { background: rgba(255, 255, 255, 0.04); }
.snapshots li.active { border-color: var(--primary); background: rgba(255, 255, 255, 0.06); }
.snap-meta { display: flex; justify-content: space-between; align-items: center; }
.snap-note { font-size: 12px; }
.snap-time { font-size: 11px; opacity: 0.5; }
.snap-actions { margin-top: 6px; }
.snap-actions button { width: 100%; padding: 4px; font-size: 12px; }
</style>
