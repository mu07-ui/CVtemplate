<script setup>
/**
 * 美化面板（AC-16.2 图片 / AC-16.3 文本 / AC-16.4 入场动效开关）
 */
import { FONT_PRESETS } from '../core/beautify.js'
import { pushHistory, updateElement } from '../store/site.js'

const props = defineProps({ el: { type: Object, required: true } })

function set(key, value) {
  pushHistory()
  updateElement(props.el.id, { props: { ...props.el.props, [key]: value } })
}
</script>

<template>
  <div class="beautify">
    <!-- 图片美化（AC-16.2） -->
    <template v-if="el.type === 'image'">
      <h3>图片美化</h3>
      <label>透明度
        <input type="range" min="0" max="1" step="0.05" :value="el.props.opacity ?? 1"
          @input="set('opacity', +$event.target.value)" />
      </label>
      <label>圆角
        <input type="range" min="0" max="50" step="1" :value="el.props.radius ?? 0"
          @input="set('radius', +$event.target.value)" />
      </label>
      <label>阴影
        <select :value="el.props.shadow ?? ''" @change="set('shadow', $event.target.value)">
          <option value="">无</option>
          <option value="soft">柔和</option>
          <option value="strong">强烈</option>
        </select>
      </label>
      <label>灰度
        <input type="range" min="0" max="100" step="1" :value="el.props.grayscale ?? 0"
          @input="set('grayscale', +$event.target.value)" />
      </label>
      <label>模糊（px）
        <input type="range" min="0" max="20" step="0.5" :value="el.props.blur ?? 0"
          @input="set('blur', +$event.target.value)" />
      </label>
    </template>

    <!-- 文本美化（AC-16.3） -->
    <template v-if="el.type === 'text'">
      <h3>文本美化</h3>
      <label>字体
        <select :value="el.props.fontFamily ?? 'sans'" @change="set('fontFamily', $event.target.value)">
          <option v-for="f in FONT_PRESETS" :key="f.id" :value="f.id">{{ f.label }}</option>
        </select>
      </label>
      <label>行高
        <input type="range" min="0.8" max="3" step="0.1" :value="el.props.lineHeight ?? 1.6"
          @input="set('lineHeight', +$event.target.value)" />
      </label>
      <label>描边颜色
        <input type="color" :value="el.props.strokeColor || '#000000'"
          @input="set('strokeColor', $event.target.value)" />
      </label>
      <label>描边宽度
        <input type="range" min="0" max="4" step="0.5" :value="el.props.strokeWidth ?? 0"
          @input="set('strokeWidth', +$event.target.value)" />
      </label>
    </template>

    <!-- 入场动效开关（AC-16.4，所有元素） -->
    <label class="row">
      <input
        type="checkbox"
        :checked="el.props.animate !== false"
        @change="set('animate', $event.target.checked)"
      />
      入场动效
    </label>
  </div>
</template>

<style scoped>
.beautify { border-top: 1px dashed rgba(128, 128, 128, 0.4); padding-top: 8px; margin-top: 4px; }
.beautify h3 { font-size: 12px; opacity: 0.7; margin: 6px 0; }
.beautify label { display: block; font-size: 13px; margin-bottom: 8px; }
.beautify input, .beautify select { width: 100%; margin-top: 4px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; }
.beautify input[type='range'], .beautify input[type='color'], .beautify input[type='checkbox'] { width: auto; }
.beautify .row { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
</style>
