import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// 库构建:只打 src/index.js 入口;playground/ 是独立 dev 页,不进产物。
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      formats: ['es'],
      fileName: () => 'index.js'
    },
    rollupOptions: {
      external: ['vue', '@agenthub-cloud/chat'],
      output: {
        preserveModules: false,
        assetFileNames: assetInfo => (assetInfo.name?.endsWith('.css') ? 'index.css' : assetInfo.name)
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api']
      }
    }
  }
})
