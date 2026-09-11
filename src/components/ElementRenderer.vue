<template>
  <div class="renderer" :class="enterClass" :style="wrapperStyle">
    <!-- 文本（AC-3.2 / AC-12 双语渲染 / AC-16.3 文本美化） -->
    <div v-if="el.type === 'text'" class="text-el" :style="textStyle">{{ text(el.props.content) }}</div>

    <!-- 图片（AC-3.3 / AC-16.2 图片美化）：空 src 显示占位 -->
    <template v-else-if="el.type === 'image'">
      <img v-if="el.props.src" :src="el.props.src" :alt="text(el.props.alt)" class="fill-img" :style="imgStyle" />
      <div v-else class="placeholder" :style="imgStyle">图片</div>
    </template>

    <!-- 视频（AC-3.4 / AC-8）：外链 iframe 或本地 video -->
    <template v-else-if="el.type === 'video'">
      <iframe
        v-if="el.props.source === 'link' && embedUrl"
        :src="embedUrl"
        frameborder="0"
        allowfullscreen
        class="fill-box"
      ></iframe>
      <video v-else-if="el.props.source === 'upload' && el.props.src" :src="el.props.src" controls class="fill-box"></video>
      <div v-else class="placeholder">视频</div>
    </template>

    <!-- 链接卡片（AC-3.5 / AC-8.3）：外链新标签打开；站内 hash 链接当前页跳转（AC-10.10） -->
    <a
      v-else-if="el.type === 'link'"
      :href="el.props.url"
      :target="isHash ? undefined : '_blank'"
      :rel="isHash ? undefined : 'noopener'"
      class="link-card"
    >
      <span class="link-title">{{ text(el.props.title) }}</span>
      <span v-if="!isHash" class="link-url">{{ el.props.url }}</span>
    </a>

    <!-- 技能标签（AC-3.6） -->
    <div v-else-if="el.type === 'skillTag'" class="tags" :style="tagsStyle">
      <span v-for="t in el.props.tags" :key="t" class="tag">{{ t }}</span>
    </div>

    <!-- 相册（AC-3.7）：缩略图 + 灯箱 -->
    <template v-else-if="el.type === 'gallery'">
      <div class="gallery">
        <figure v-for="(img, i) in el.props.images" :key="i" class="gallery-item" @click="lightbox = i">
          <img v-if="img.src" :src="img.src" :alt="text(img.caption)" />
          <div v-else class="placeholder">{{ text(img.caption) || '图片' }}</div>
          <figcaption v-if="img.caption">{{ text(img.caption) }}</figcaption>
        </figure>
      </div>
      <div v-if="lightbox !== null" class="lightbox" @click="lightbox = null">
        <img :src="el.props.images[lightbox]?.src" :alt="text(el.props.images[lightbox]?.caption)" />
      </div>
    </template>

    <!-- 装饰（AC-3.8） -->
    <template v-else-if="el.type === 'decoration'">
      <div v-if="el.props.shape === 'block'" class="deco-block" :style="decoStyle"></div>
      <div v-else-if="el.props.shape === 'line'" class="deco-line" :style="decoStyle"></div>
      <div v-else class="deco-icon" :style="decoStyle">◆</div>
    </template>

    <!-- AC-16.1 结构化元素：时间线 / 技能矩阵 / 荣誉 / 联系卡 -->
    <StructuredElements
      v-else-if="['timeline', 'skillMatrix', 'honors', 'contactCard'].includes(el.type)"
      :element="el"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { toEmbedUrl } from '../core/storage.js'
import { pickText } from '../core/i18n.js'
import { site } from '../store/site.js'
import { normalizeImageStyle, normalizeTextStyle, imageFilterCss, fontCss } from '../core/beautify.js'
import StructuredElements from './StructuredElements.vue'

const props = defineProps({
  element: { type: Object, required: true },
  scale: { type: Number, default: 1 }, // 画布宽 / 1440，用于字号等比缩放
})

const el = computed(() => props.element)
const lightbox = ref(null)

/** 双语字段按当前展示语言取值（AC-12） */
const text = (v) => pickText(v, site.locale)

/** AC-10.10 站内 hash 链接（如 #/works）：当前页跳转、不展示 url 明文 */
const isHash = computed(() => String(el.value.props?.url || '').startsWith('#'))

/** AC-16.4 入场动效：元素开关与动效档位联动（节能档禁用） */
const enterClass = computed(() =>
  el.value.props?.animate !== false && site.motion?.level !== 'quiet' ? 'el-enter' : '',
)

const wrapperStyle = computed(() => {
  const s = { pointerEvents: 'auto' }
  if (el.value.type === 'decoration') {
    s.opacity = el.value.props.opacity
  } else if (el.value.type === 'image') {
    const img = normalizeImageStyle(el.value.props)
    s.opacity = img.opacity
    s.borderRadius = `${img.radius}%`
    if (img.shadow === 'soft') s.boxShadow = '0 8px 30px rgba(0,0,0,0.25)'
    else if (img.shadow === 'strong') s.boxShadow = '0 12px 40px rgba(0,0,0,0.45)'
  }
  return s
})

/** AC-16.2 图片滤镜（灰度/模糊）+ 圆角裁剪 */
const imgStyle = computed(() => {
  const img = normalizeImageStyle(el.value.props)
  return {
    filter: imageFilterCss(img) || undefined,
    borderRadius: `${img.radius}%`,
  }
})

const textStyle = computed(() => {
  const b = normalizeTextStyle(el.value.props)
  const stroke = b.strokeWidth > 0 && b.strokeColor
  return {
    fontSize: `${(el.value.props.fontSize ?? 16) * props.scale}px`,
    color: el.value.props.color,
    fontWeight: el.value.props.weight ?? 400,
    textAlign: el.value.props.align ?? 'left',
    letterSpacing: '0.02em',
    lineHeight: b.lineHeight,
    fontFamily: fontCss(b.fontFamily),
    WebkitTextStroke: stroke ? `${b.strokeWidth}px ${b.strokeColor}` : undefined,
    overflow: 'hidden',
  }
})

const decoStyle = computed(() => ({
  background: el.value.props.color,
  width: '100%',
  height: '100%',
  filter: el.value.props.blur ? `blur(${el.value.props.blur}px)` : 'none',
}))

const tagsStyle = computed(() => ({
  justifyContent: el.value.props.align === 'center' ? 'center' : 'flex-start',
}))

const embedUrl = computed(() => {
  try {
    return el.value.props.url ? toEmbedUrl(el.value.props.url) : ''
  } catch {
    return ''
  }
})
</script>

<style scoped>
.renderer { width: 100%; height: 100%; overflow: visible; }
/* AC-16.4 入场动效（动效档位 none 或元素关闭时不加该类） */
.renderer.el-enter { animation: el-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes el-rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
.fill-img, .fill-box { width: 100%; height: 100%; object-fit: cover; display: block; }
.placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: repeating-linear-gradient(45deg, #e8ebf0, #e8ebf0 8px, #dfe3ea 8px, #dfe3ea 16px);
  color: #9aa3af; font-size: 13px; overflow: hidden; white-space: nowrap;
}
.text-el { width: 100%; height: 100%; }
.link-card {
  display: flex; flex-direction: column; justify-content: center; gap: 4px;
  width: 100%; height: 100%; padding: 10px 16px; text-decoration: none;
  background: rgba(255, 255, 255, 0.04); border: 1px solid color-mix(in srgb, var(--primary) 55%, transparent);
  border-radius: var(--radius); box-shadow: var(--shadow); color: var(--fg);
  backdrop-filter: blur(12px); transition: transform 0.2s, border-color 0.2s;
}
.link-card:hover { transform: translateY(-3px); border-color: var(--primary); }
.link-title { font-weight: 600; color: var(--primary); letter-spacing: 0.04em; }
.link-url { font-size: 12px; opacity: 0.55; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; align-content: center; width: 100%; height: 100%; }
.tag {
  padding: 5px 16px; border-radius: 999px; font-size: 13px; letter-spacing: 0.05em;
  background: color-mix(in srgb, var(--primary) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary) 45%, transparent);
  color: var(--primary); white-space: nowrap;
}
.gallery { display: flex; gap: 10px; width: 100%; height: 100%; }
.gallery-item { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; cursor: zoom-in; }
.gallery-item img, .gallery-item .placeholder { flex: 1; min-height: 0; width: 100%; border-radius: var(--radius); object-fit: cover; transition: transform 0.25s; }
.gallery-item:hover img { transform: translateY(-4px); }
.gallery-item figcaption { font-size: 12px; color: var(--fg); opacity: 0.65; text-align: center; letter-spacing: 0.06em; }
.lightbox {
  position: fixed; inset: 0; z-index: 9999; background: rgba(0, 0, 0, 0.8);
  display: flex; align-items: center; justify-content: center; cursor: zoom-out;
}
.lightbox img { max-width: 90%; max-height: 90%; }
.deco-block { border-radius: var(--radius); }
.deco-line { height: 100%; }
.deco-icon { display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 24px; }
</style>
