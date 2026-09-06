/**
 * UI 桥:库对宿主环境的唯一依赖注入点。
 *
 * chat-ui 的三个富媒体 composable 需要带鉴权拉工作区 blob,ToolStep 需要按需拉
 * 工具结果全文——这些 REST 属于宿主(桌面/插件/管理端各自封装),库不内置 axios、
 * 不读 import.meta.env、不认识宿主的 token 模块。宿主在装配时调一次 configureUiBridge:
 *
 *   configureUiBridge({
 *     baseURL: import.meta.env.VITE_APP_BASE_API,   // 工作区下载地址前缀
 *     getToken: () => getToken(),                    // blob 请求的 Bearer
 *     request: axiosInstance,                        // 需要 config => Promise({ data }) 形态
 *     getToolResult: (sessionId, messageId) => ...   // ToolStep「查看全文」;不配则该入口隐藏
 *     getSpecialEvents: (sessionId, { messageId, name }) => ... // CitationsView 引用事件
 *     getUser: () => ({ avatar, nickName, userName })  // ChatMessage 头像/昵称(传响应式 getter 保持更新)
 *     getSkills: () => skillsArray                     // ChatMessage 技能 chip(响应式 getter)
 *     workspace: { deleteFile, downloadBlob, getFile, downloadUrl, clear, downloadZipBlob, getTree, upload }
 *     userFile:  { saveFromWorkspace }                 // WorkspaceDrawer「存回个人文件」
 *     kb:        { getDocPreview, downloadDocument, listDoc, listOptions }  // CitationPreviewDialog 预览;listOptions 供 MessageInput 知识库选择器
 *   })
 *
 * 未配置时:富媒体加载与查看全文入口安静降级(不抛错、不打断渲染)。
 */

let bridge = null

export function configureUiBridge(config) {
  bridge = config
}

export function getUiBridge() {
  return bridge
}

/** 供富媒体 composable 用的 blob 请求;未配置返回 null 让调用方降级。 */
export function requestWorkspaceBlob(path) {
  if (!bridge?.request || !bridge?.baseURL) return null
  const headers = bridge.getToken ? { Authorization: 'Bearer ' + bridge.getToken() } : {}
  return bridge.request({
    method: 'get',
    url: bridge.baseURL + path,
    responseType: 'blob',
    headers
  })
}
