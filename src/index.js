/**
 * @agenthub-cloud/ui 主入口:三端共用的聊天 UI 原子组件库。
 *
 * 分层:
 * - chat-ui/*:聊天表面原子(时间线/消息/步骤/输入/引用/刻度条/链路面板)
 * - components/*:基础与会话/工作区原子
 * - theme/*:主题 composable 与确定性配色
 * - uiBridge:宿主环境依赖注入(configureUiBridge,宿主装配时调一次)
 *
 * 组件为 JS SFC;props 类型来自 @agenthub-cloud/chat(peerDependency)。
 */

// —— 聊天表面原子 ——
export { default as ChatBody } from './chat-ui/components/ChatBody.vue'
export { default as ChatMessage } from './chat-ui/components/ChatMessage.vue'
export { default as ChatTimeline } from './chat-ui/components/ChatTimeline.vue'
export { default as ChatWelcome } from './chat-ui/components/ChatWelcome.vue'
export { default as MessageInput } from './chat-ui/components/MessageInput.vue'
export { default as MarkdownContent } from './chat-ui/components/MarkdownContent.vue'
export { default as ProcessNode } from './chat-ui/components/ProcessNode.vue'
export { default as ThinkingNode } from './chat-ui/components/ThinkingNode.vue'
export { default as CitationsView } from './chat-ui/components/CitationsView.vue'
export { default as CitationPreviewDialog } from './chat-ui/components/CitationPreviewDialog.vue'
export { default as ContextMeter } from './chat-ui/components/ContextMeter.vue'
export { default as TurnChangesSummary } from './chat-ui/components/TurnChangesSummary.vue'
export { default as TracePanel } from './chat-ui/components/TracePanel.vue'
export { default as ChatHeader } from './chat-ui/components/ChatHeader.vue'
export { default as ToolImages } from './chat-ui/components/ToolImages.vue'
export { default as ToolVideos } from './chat-ui/components/ToolVideos.vue'
export { default as ToolAudios } from './chat-ui/components/ToolAudios.vue'
export { default as AgentStep } from './chat-ui/components/steps/AgentStep.vue'
export { default as ToolStep } from './chat-ui/components/steps/ToolStep.vue'
export { default as ReasoningStep } from './chat-ui/components/steps/ReasoningStep.vue'
export { default as SummaryStep } from './chat-ui/components/steps/SummaryStep.vue'
export { default as ToolIcon } from './chat-ui/components/steps/ToolIcon.vue'
export { default as KbChunksView } from './chat-ui/components/steps/KbChunksView.vue'

// —— 基础与会话/工作区原子 ——
export { default as AppConfirm } from './components/AppConfirm.vue'
export { default as AppToast } from './components/AppToast.vue'
export { default as AppPageLoader } from './components/AppPageLoader.vue'
export { default as AuthHeroBackdrop } from './components/AuthHeroBackdrop.vue'
export { default as ProjectDialog } from './components/ProjectDialog.vue'
export { default as WorkspaceDrawer } from './components/WorkspaceDrawer.vue'
export { default as WorkspacePreviewModal } from './components/WorkspacePreviewModal.vue'
export { default as SessionSidebar } from './components/SessionSidebar.vue'

// —— composables ——
export { useScroll } from './chat-ui/composables/useScroll.js'
export { useStepToggle } from './chat-ui/composables/useStepDisplay.js'
export { useToolImages } from './chat-ui/composables/useToolImages.js'
export { useToolVideos } from './chat-ui/composables/useToolVideos.js'
export { useToolAudios } from './chat-ui/composables/useToolAudios.js'
export { mergeWorkspaceChanges, collectFileChangesFromSteps, workspaceChangeCounts } from './chat-ui/composables/workspaceChanges.js'
export { confirmDanger, toast, confirmState, resolveConfirm } from './composables/useConfirm.js'
export { useDialogLifecycle } from './composables/useDialogLifecycle.js'

// —— 主题与配色 ——
export { useTheme } from './theme/useTheme.js'
export { paletteOf, gradientOf, colorOf, softOf, glowOf, THEME_COUNT } from './theme/ai-palette.js'

// —— 宿主环境桥 ——
export { configureUiBridge, getUiBridge } from './uiBridge.js'
