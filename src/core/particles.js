/**
 * 粒子动效引擎（AC-15）：Canvas 2D 纯逻辑，零新增运行时依赖
 * 三场景：星域连线 / 网格漂移 / 光斑浮动
 * 三档：quiet 节能 / standard 标准 / rich 沉浸
 */

/** 粒子场景列表（AC-15.1） */
export const PARTICLE_SCENES = ['starfield', 'gridDrift', 'lightOrb']

/** 动效档位（AC-15.2） */
export const MOTION_LEVELS = ['quiet', 'standard', 'rich']

/** 各档位粒子数（按屏幕面积自适应） */
const DENSITY = { quiet: 0.00006, standard: 0.00014, rich: 0.00024 }

/** 各场景粒子运动速度倍率 */
const SPEED = { quiet: 0.18, standard: 0.45, rich: 0.8 }

/** 生成随机数 [min, max) */
function rnd(min, max) { return min + Math.random() * (max - min) }

/**
 * 创建粒子数组（AC-15.1）：
 * - starfield：星点 + 连线半径（近距星点连线）
 * - gridDrift：网格交叉点 + 漂移速度
 * - lightOrb：光斑 + 脉动相位
 */
export function createParticles(scene, level, w, h) {
  const area = w * h
  const count = Math.max(6, Math.round(area * DENSITY[level] ?? DENSITY.standard))
  const speed = SPEED[level] ?? SPEED.standard

  if (scene === 'starfield') {
    return Array.from({ length: count }, () => ({
      x: rnd(0, w), y: rnd(0, h),
      vx: rnd(-1, 1) * speed, vy: rnd(-1, 1) * speed,
      r: rnd(0.5, 2.5),
      linkRadius: rnd(80, 140),
    }))
  }

  if (scene === 'gridDrift') {
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)
    const stepX = w / cols, stepY = h / rows
    const pts = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (pts.length >= count) break
        pts.push({
          x: stepX * c + rnd(-stepX * 0.3, stepX * 0.3),
          y: stepY * r + rnd(-stepY * 0.3, stepY * 0.3),
          vx: rnd(-1, 1) * speed, vy: rnd(-1, 1) * speed,
          cellX: c, cellY: r,
        })
      }
    }
    return pts
  }

  // lightOrb
  return Array.from({ length: count }, () => ({
    x: rnd(0, w), y: rnd(0, h),
    vx: rnd(-0.5, 0.5) * speed, vy: rnd(-0.5, 0.5) * speed,
    r: rnd(30, 80),
    phase: rnd(0, Math.PI * 2),
    phaseSpeed: rnd(0.5, 1.5),
  }))
}

/**
 * 步进粒子（AC-15.2）：按 dt 秒更新位置，边界循环回绕
 */
export function stepParticles(particles, scene, level, dt, w, h) {
  const speed = SPEED[level] ?? SPEED.standard
  for (const p of particles) {
    p.x += p.vx * dt * 60
    p.y += p.vy * dt * 60
    // 边界回绕
    if (p.x < -10) p.x = w + 10
    else if (p.x > w + 10) p.x = -10
    if (p.y < -10) p.y = h + 10
    else if (p.y > h + 10) p.y = -10
    // 光斑脉动
    if (scene === 'lightOrb' && p.phaseSpeed !== undefined) {
      p.phase += p.phaseSpeed * dt
    }
  }
}

/**
 * 移动端自动降级（AC-15.3）：移动端 UA + 触屏将 rich/standard 降为 quiet
 */
export function effectiveLevel(level, userAgent) {
  const ua = (userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase()
  const isMobile = /mobile|iphone|android.*mobile|windows phone/i.test(ua)
  if (isMobile) return 'quiet'
  if (shouldReduceMotion()) return 'quiet'
  return MOTION_LEVELS.includes(level) ? level : 'standard'
}

/**
 * 适配 prefers-reduced-motion（AC-15.5）
 */
export function shouldReduceMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
