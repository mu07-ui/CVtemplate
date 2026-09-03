import { createRouter, createWebHashHistory } from 'vue-router'

// 展示页与编辑器页完全分离（AC-1.2）；编辑器懒加载分包，公开产物不含编辑器代码（AC-1.3）
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'display', component: () => import('./pages/DisplayPage.vue') },
    { path: '/editor', name: 'editor', component: () => import('./pages/EditorPage.vue') },
  ],
})
