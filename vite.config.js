import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// 库构建:只打 src/index.js 入口;playground/ 是独立 dev 页,不进产物。
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.js'),
        pages: path.resolve(__dirname, 'src/pages.js')
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: ['vue', '@agenthub-cloud/chat', '3d-force-graph', 'three-spritetext'],
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
