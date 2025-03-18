import { createRouter, createWebHashHistory, createWebHistory, type RouteRecordRaw } from 'vue-router'
// import EditorView from '../views/EditorView.vue'
import NextEditor from '../views/NextEditorVue.vue'
import TestPage from '../views/TestPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Editor',
    component: NextEditor
  },
  {
    path: '/test-page',
    name: 'TestPage',
    component: TestPage
  }
  // 可以添加更多路由...
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router