/** playground 入口:演示宿主装配模式(theme + uiBridge)并挂载原子展示页。 */
import { createApp } from 'vue'
import App from './App.vue'
import { configureUiBridge, useTheme } from '../src/index.js'

// 宿主装配示例:playground 里全是演示桩;真实宿主(desktop/extension/ruoyi-ui)
// 在这里注入自己的 axios 实例、token 读取与会话/知识库 REST。
configureUiBridge({
  baseURL: '/dev-api',
  getToken: () => 'playground-demo-token',
  request: async config => {
    console.log('[playground] request', config)
    return { data: null }
  },
  getToolResult: async () => ({ data: { toolResult: '(playground 演示)完整工具结果文本' } }),
  getSpecialEvents: async () => ({ data: [] }),
  getUser: () => ({ nickName: '演示用户', userName: 'demo', avatar: '' }),
  getSkills: () => [{ skillId: 1, skillName: '代码审查' }],
  getLatestUsage: async () => null,
  kb: {
    getDocPreview: async () => ({ data: null }),
    downloadDocument: async () => ({ data: null }),
    listDoc: async () => ({ data: { rows: [] } }),
    listOptions: async () => ({ data: [] })
  },
  workspace: {
    getFile: async () => ({ data: null }),
    getTree: async () => ({ data: [] }),
    upload: async () => ({ data: null }),
    deleteFile: async () => ({ data: null }),
    clear: async () => ({ data: null }),
    downloadBlob: async () => ({ data: new Blob() }),
    downloadZipBlob: async () => ({ data: new Blob() }),
    downloadUrl: (sessionId, path) => `/dev-api/ai/chat/workspace/${sessionId}/download?path=${encodeURIComponent(path)}`
  },
  userFile: { saveFromWorkspace: async () => ({ data: null }) }
})

const theme = useTheme()
theme.initTheme()

createApp(App).mount('#app')
