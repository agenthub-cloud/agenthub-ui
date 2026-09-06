import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// playground 独立配置:`vite playground` 以本目录为 root,根配置不生效,这里自带 vue 插件与 scss 选项。
export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  resolve: {
    alias: { '@': path.resolve(__dirname, '../src') }
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api']
      }
    }
  },
  server: { port: 5173 }
})
