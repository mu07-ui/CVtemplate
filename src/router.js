import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * 多页路由站（AC-10.1）：hash 模式保证导出后离线可用；
 * 展示页共用 ShowcasePage 组件（懒加载分包，AC-1.3），由 meta.pageKey 决定渲染哪一页
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // props 函数把 meta.pageKey 注入 ShowcasePage（router-view 不会自动传 props）
    { path: '/', name: 'home', component: () => import('./pages/showcase/ShowcasePage.vue'), meta: { pageKey: 'home' }, props: (r) => ({ pageKey: r.meta.pageKey }) },
    { path: '/works', name: 'works', component: () => import('./pages/showcase/ShowcasePage.vue'), meta: { pageKey: 'works' }, props: (r) => ({ pageKey: r.meta.pageKey }) },
    { path: '/projects', name: 'projects', component: () => import('./pages/showcase/ShowcasePage.vue'), meta: { pageKey: 'projects' }, props: (r) => ({ pageKey: r.meta.pageKey }) },
    { path: '/about', name: 'about', component: () => import('./pages/showcase/ShowcasePage.vue'), meta: { pageKey: 'about' }, props: (r) => ({ pageKey: r.meta.pageKey }) },
    { path: '/editor', name: 'editor', component: () => import('./pages/EditorPage.vue') },
    // 兜底重定向（AC-10.9）
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
