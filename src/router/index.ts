import { createRouter, createWebHashHistory, createWebHistory, type RouteRecordRaw } from 'vue-router'

import NextEditor from '../views/NextEditorVue.vue'
import TestPage from '../views/TestPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Editor',
    component: NextEditor
  },
  {
    path: '/test',
    name: 'TestPage',
    component: TestPage
  }
  
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router