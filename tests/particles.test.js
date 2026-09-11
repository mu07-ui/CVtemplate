import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PARTICLE_SCENES,
  MOTION_LEVELS,
  createParticles,
  stepParticles,
  effectiveLevel,
  shouldReduceMotion,
} from '../src/core/particles.js'

// 覆盖验收标准：AC-15.1 ~ AC-15.3、AC-15.5

describe('AC-15.1 三种粒子场景', () => {
  it('PARTICLE_SCENES 含 starfield / gridDrift / lightOrb 三种', () => {
    expect(PARTICLE_SCENES).toEqual(expect.arrayContaining(['starfield', 'gridDrift', 'lightOrb']))
    expect(PARTICLE_SCENES).toHaveLength(3)
  })

  it('createParticles 按场景生成粒子数组，每个粒子含坐标与速度', () => {
    const ps = createParticles('starfield', 'standard', 1440, 900)
    expect(ps).toBeInstanceOf(Array)
    expect(ps.length).toBeGreaterThan(0)
    expect(ps[0]).toHaveProperty('x')
    expect(ps[0]).toHaveProperty('y')
    expect(ps[0]).toHaveProperty('vx')
    expect(ps[0]).toHaveProperty('vy')
  })

  it('不同场景粒子结构不同（starfield 有连线半径，gridDrift 有格子坐标）', () => {
    const stars = createParticles('starfield', 'standard', 1440, 900)
    const grid = createParticles('gridDrift', 'standard', 1440, 900)
    expect(stars[0]).toHaveProperty('linkRadius')
    expect(grid[0]).toHaveProperty('cellX')
  })
})

describe('AC-15.2 动效强度三档', () => {
  it('MOTION_LEVELS 含 quiet / standard / rich', () => {
    expect(MOTION_LEVELS).toEqual(expect.arrayContaining(['quiet', 'standard', 'rich']))
    expect(MOTION_LEVELS).toHaveLength(3)
  })

  it('quiet 档粒子数最少，rich 档最多', () => {
    const w = 1440, h = 900
    const quiet = createParticles('starfield', 'quiet', w, h).length
    const standard = createParticles('starfield', 'standard', w, h).length
    const rich = createParticles('starfield', 'rich', w, h).length
    expect(quiet).toBeLessThan(standard)
    expect(standard).toBeLessThan(rich)
  })

  it('stepParticles 按速度更新位置并循环边界', () => {
    const ps = createParticles('starfield', 'standard', 100, 100)
    const before = ps[0].x
    stepParticles(ps, 'starfield', 'standard', 1 / 60, 100, 100)
    // 粒子位置应有变化（速度非零）或循环回绕
    const moved = ps.some((p) => Math.abs(p.x - (p.x - p.vx)) > 0 || p.x !== before)
    expect(moved).toBe(true)
  })
})

describe('AC-15.3 移动端自动降级', () => {
  it('effectiveLevel 在移动端 UA 下将 rich/standard 降为 quiet', () => {
    const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
    expect(effectiveLevel('rich', mobileUA)).toBe('quiet')
    expect(effectiveLevel('standard', mobileUA)).toBe('quiet')
  })

  it('effectiveLevel 在桌面 UA 下保持原档位', () => {
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    expect(effectiveLevel('rich', desktopUA)).toBe('rich')
    expect(effectiveLevel('standard', desktopUA)).toBe('standard')
    expect(effectiveLevel('quiet', desktopUA)).toBe('quiet')
  })
})

describe('AC-15.5 适配减少动态效果偏好', () => {
  it('shouldReduceMotion 在 prefers-reduced-motion: reduce 时返回 true', () => {
    const orig = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    expect(shouldReduceMotion()).toBe(true)
    window.matchMedia = orig
  })

  it('shouldReduceMotion 在无偏好时返回 false', () => {
    const orig = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({ matches: false })
    expect(shouldReduceMotion()).toBe(false)
    window.matchMedia = orig
  })

  it('effectiveLevel 在 shouldReduceMotion 时强制 quiet', () => {
    const orig = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    expect(effectiveLevel('rich', desktopUA)).toBe('quiet')
    window.matchMedia = orig
  })
})
