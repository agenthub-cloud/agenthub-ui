# @agenthub-cloud/ui

AgentHub 多端 UI SDK，供 Desktop、浏览器插件和 PC 管理端复用聊天、会话、工作区以及文件/知识库/资源页面。

## 安装

```bash
npm install @agenthub-cloud/chat @agenthub-cloud/ui
```

```js
import '@agenthub-cloud/ui/css'
import { ChatTimeline, configureUiBridge } from '@agenthub-cloud/ui'
import { FilesView, KnowledgeBaseView, ResourceView } from '@agenthub-cloud/ui/pages'
```

基础聊天组件从主入口导入；完整业务页面放在 `/pages` 子入口，避免未使用页面进入聊天基础包。页面本身不绑定 axios、token 或 Pinia，宿主在启动时通过 `configureUiBridge` 注入 `userFile`、`kb`、`resources` 服务与用户 getter。

无头数据服务由配套的 `@agenthub-cloud/chat` 提供。`createChatClient()` 返回 `files`、`knowledgeBases`、`resources`，宿主也可以注入兼容实现。

## 验证

```bash
npm test
npm run typecheck
npm run build
```

## License

[MIT](./LICENSE)
