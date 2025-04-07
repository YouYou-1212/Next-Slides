import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'
import ViteBaseConfig from "./environment/vite.base.config"
import ViteProdConfig from "./environment/vite.prod.config"
import ViteDevConfig from "./environment/vite.dev.config"

const envResolver = {
  "build": () => {
    console.log("生产环境")
    return ({ ...ViteBaseConfig, ...ViteProdConfig })
  },
  "dev": () => {
    console.log("开发环境")
    return ({ ...ViteBaseConfig, ...ViteDevConfig })
  }
}
const mode = process.env.NODE_ENV === 'production' ? 'build' : 'dev';
const envConfig = envResolver[mode]();

export default defineConfig({
  ...envConfig,
  plugins: [
    vue(),
    basicSsl(),
  ],
})
