<template>
  <div class="tech-backdrop" aria-hidden="true">
    <div class="tb-grid"></div>
    <div class="tb-net"></div>
    <div class="tb-vignette"></div>
  </div>
</template>

<script setup>
// 科技氛围背景层（AC-4.5）：细网格呼吸 + 星座连线慢漂移 + 每屏暗角
// 纯 CSS 实现，随画布等比平铺（每 100vh 一组），无 DOM 副作用
</script>

<style scoped>
.tech-backdrop { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.tb-grid, .tb-net, .tb-vignette { position: absolute; inset: 0; }

/* 细网格：低透明度呼吸 */
.tb-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 72px 72px;
  animation: tb-breathe 14s ease-in-out infinite alternate;
}

/* 星座节点连线：每 100vh 平铺一组，缓慢上漂 */
.tb-net {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 900'%3E%3Cg stroke='rgba(255,255,255,0.13)' stroke-width='1' fill='none'%3E%3Cpath d='M60 140L300 260L560 180'/%3E%3Cpath d='M1100 700L1320 560L1380 760'/%3E%3Cpath d='M180 720L420 830L640 760'/%3E%3Cpath d='M900 150L1120 90L1300 200'/%3E%3C/g%3E%3Cg fill='rgba(125,211,252,0.4)'%3E%3Ccircle cx='60' cy='140' r='3'/%3E%3Ccircle cx='300' cy='260' r='2.5'/%3E%3Ccircle cx='560' cy='180' r='2'/%3E%3Ccircle cx='1100' cy='700' r='3'/%3E%3Ccircle cx='1320' cy='560' r='2.5'/%3E%3Ccircle cx='1380' cy='760' r='2'/%3E%3Ccircle cx='180' cy='720' r='2.5'/%3E%3Ccircle cx='420' cy='830' r='2'/%3E%3Ccircle cx='640' cy='760' r='3'/%3E%3Ccircle cx='900' cy='150' r='2.5'/%3E%3Ccircle cx='1120' cy='90' r='2'/%3E%3Ccircle cx='1300' cy='200' r='3'/%3E%3C/g%3E%3C/svg%3E");
  background-size: 100% 100vh;
  background-repeat: repeat-y;
  animation: tb-drift 90s linear infinite;
}

/* 暗角：每屏收拢视线，增强层次 */
.tb-vignette {
  background-image: radial-gradient(120% 65% at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.38) 100%);
  background-size: 100% 100vh;
  background-repeat: repeat-y;
}

@keyframes tb-breathe {
  from { opacity: 0.55; }
  to { opacity: 1; }
}
@keyframes tb-drift {
  from { background-position: 0 0; }
  to { background-position: 0 100vh; }
}
</style>
