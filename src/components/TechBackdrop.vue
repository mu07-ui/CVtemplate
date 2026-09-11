<template>
  <div class="tech-backdrop" aria-hidden="true">
    <canvas ref="canvas" class="tb-canvas"></canvas>
    <div class="tb-grid"></div>
    <div class="tb-vig"></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { THEMES } from '../core/theme.js'
import { createParticles, stepParticles, effectiveLevel } from '../core/particles.js'
import { site } from '../store/site.js'

const props = defineProps({
  themeId: { type: String, default: 'business' },
  motionLevel: { type: String, default: 'standard' },
})

const canvas = ref(null)
let ctx = null
let particles = []
let rafId = null
let lastTime = 0
let paused = false
let cleanupFn = null

const theme = () => THEMES[props.themeId] ?? THEMES.business
const scene = () => theme().particleScene

function level() {
  return effectiveLevel(props.motionLevel, navigator.userAgent)
}

function resize() {
  const c = canvas.value
  if (!c) return
  const rect = c.parentElement.getBoundingClientRect()
  c.width = rect.width
  c.height = rect.height
  particles = createParticles(scene(), level(), c.width, c.height)
}

function render(ts) {
  if (paused || !ctx) { rafId = null; return }
  const dt = lastTime ? Math.min(0.05, (ts - lastTime) / 1000) : 0.016
  lastTime = ts

  stepParticles(particles, scene(), level(), dt, canvas.value.width, canvas.value.height)

  const w = canvas.value.width
  const h = canvas.value.height
  ctx.clearRect(0, 0, w, h)

  const s = scene()
  const t = theme()
  const color = t.primary

  if (s === 'starfield') {
    ctx.fillStyle = color
    for (const p of particles) {
      ctx.globalAlpha = 0.5 + (p.r / 3) * 0.5
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }
    // 连线
    ctx.globalAlpha = 0.15
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < particles[i].linkRadius) {
          ctx.globalAlpha = (1 - d / particles[i].linkRadius) * 0.2
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }
  } else if (s === 'gridDrift') {
    ctx.fillStyle = color
    ctx.globalAlpha = 0.25
    for (const p of particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
    // 连线网格
    ctx.globalAlpha = 0.08
    ctx.strokeStyle = color
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        if (Math.abs(particles[i].cellX - particles[j].cellX) <= 1 &&
            Math.abs(particles[i].cellY - particles[j].cellY) <= 1) {
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }
  } else if (s === 'lightOrb') {
    for (const p of particles) {
      const pulse = 0.5 + Math.sin(p.phase) * 0.3
      const r = Math.max(1, p.r * pulse)
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
      grad.addColorStop(0, color + '40')
      grad.addColorStop(1, color + '00')
      ctx.fillStyle = grad
      ctx.globalAlpha = 0.35
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.globalAlpha = 1
  rafId = requestAnimationFrame(render)
}

function start() {
  if (level() === 'quiet') return // 节能档不渲染粒子
  if (rafId) return
  lastTime = 0
  rafId = requestAnimationFrame(render)
}

function stop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
}

onMounted(() => {
  ctx = canvas.value?.getContext('2d')
  resize()
  start()

  const onVis = () => {
    if (document.hidden) { paused = true; stop() }
    else { paused = false; start() }
  }
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('resize', resize)

  // 保存清理函数供 onBeforeUnmount 调用
  cleanupFn = () => {
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('resize', resize)
  }
})

onBeforeUnmount(() => {
  stop()
  cleanupFn?.()
})

watch(() => [props.themeId, props.motionLevel], () => {
  resize()
  stop()
  start()
})
</script>

<style scoped>
.tech-backdrop { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.tb-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.tb-grid, .tb-vig { position: absolute; inset: 0; }

.tb-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 72px 72px;
  animation: tb-breathe 14s ease-in-out infinite alternate;
}

.tb-vig {
  background-image: radial-gradient(120% 65% at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.38) 100%);
  background-size: 100% 100vh;
  background-repeat: repeat-y;
}

@keyframes tb-breathe {
  from { opacity: 0.55; }
  to { opacity: 1; }
}
</style>
