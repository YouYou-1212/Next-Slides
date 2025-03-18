/**
 * 生产环境的配置
 */

import { defineConfig } from "vite"
console.log('load prod-config...')
export default defineConfig({
    base: './',  // 设置生产环境的基础路径为相对路径
})