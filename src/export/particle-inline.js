/**
 * 粒子引擎内联脚本（AC-18.1）：
 * 把 core/particles.js 的纯逻辑源码与 Canvas 绘制引导拼为一段自包含脚本，
 * 注入导出的 index.html，使离线静态站同样具备三场景粒子背景。
 */
import particlesRaw from '../core/particles.js?raw'

/** 去掉 ESM 导出关键字，使其可直接作为普通 <script> 内联 */
export const PARTICLE_ENGINE_SOURCE = particlesRaw.replace(/^export /gm, '')

/**
 * 生成粒子引导脚本：主题场景表 + window.__pfStart 绘制循环
 * @param {Record<string,{scene:string,primary:string,accent:string}>} themeTable 主题场景与配色表
 */
export function buildParticleScript(themeTable) {
  return `
${PARTICLE_ENGINE_SOURCE}
var PF_THEME = ${JSON.stringify(themeTable)};
window.__pfStart = function (canvas, themeId, level, table) {
  var conf = (table && table[themeId]) || table.business || null;
  if (!conf || !canvas || !canvas.getContext) return;
  var lvl = typeof effectiveLevel === 'function' ? effectiveLevel(level) : 'standard';
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  var points = createParticles(conf.scene, lvl, canvas.width, canvas.height);
  var ctx = canvas.getContext('2d');
  var last = (window.performance && performance.now) ? performance.now() : Date.now();
  function hexA(hex, a) {
    var h = String(hex || '#ffffff').replace('#', '');
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function link(a, b, dist) {
    var d2 = (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
    if (d2 > dist * dist) return;
    ctx.strokeStyle = hexA(conf.accent, 0.18 * (1 - Math.sqrt(d2) / dist));
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  function frame(now) {
    var t = now || Date.now();
    var dt = Math.min(0.05, (t - last) / 1000); last = t;
    stepParticles(points, conf.scene, lvl, dt, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var i, j, p;
    if (conf.scene === 'lightOrb') {
      for (i = 0; i < points.length; i++) {
        p = points[i];
        var rr = p.r * (0.85 + 0.15 * Math.sin(p.phase));
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
        g.addColorStop(0, hexA(i % 2 ? conf.accent : conf.primary, 0.10));
        g.addColorStop(1, hexA(i % 2 ? conf.accent : conf.primary, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      var dist = conf.scene === 'starfield' ? 140 : 90;
      for (i = 0; i < points.length; i++) for (j = i + 1; j < points.length; j++) link(points[i], points[j], dist);
      ctx.fillStyle = hexA(conf.primary, 0.7);
      for (i = 0; i < points.length; i++) {
        p = points[i];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r || 1.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', function () {
    resize();
    points = createParticles(conf.scene, lvl, canvas.width, canvas.height);
  });
  requestAnimationFrame(frame);
};
`
}
