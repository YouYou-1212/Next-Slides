import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'
// 引入三个环境配置文件
import ViteBaseConfig from "./environment/vite.base.config"
import ViteProdConfig from "./environment/vite.prod.config"
import ViteDevConfig from "./environment/vite.dev.config"

// 策略模式做一个动态的配置
const envResolver = {
  "build": () => {
    console.log("生产环境")
    // 解构的语法
    return ({ ...ViteBaseConfig, ...ViteProdConfig })
  },
  "dev": () => {
    console.log("开发环境")
    return ({ ...ViteBaseConfig, ...ViteDevConfig })
  }
}
// 获取当前环境模式
const mode = process.env.NODE_ENV === 'production' ? 'build' : 'dev';
// 获取环境配置
const envConfig = envResolver[mode]();

export default defineConfig({
  ...envConfig,
  plugins: [
    vue(),
    basicSsl(),
  ],
})
