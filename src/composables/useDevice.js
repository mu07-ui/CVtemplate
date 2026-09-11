/**
 * 视口设备类型响应式跟踪（AC-11.2 / AC-11.5）
 * 监听 window resize，返回 mobile/tablet/pc
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { deviceOf } from '../core/responsive.js'

export function useDevice() {
  const device = ref('pc')

  function update() {
    if (typeof window !== 'undefined') device.value = deviceOf(window.innerWidth)
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })
  onBeforeUnmount(() => window.removeEventListener('resize', update))

  return { device }
}
