<!-- playground 主页:每个原子一页/一区块,mock engine 数据;不追求布局,只做视觉验收基线。 -->
<script setup>
import { ref } from 'vue'
import {
  ChatWelcome, ChatTimeline, ChatMessage, MessageInput, ContextMeter, SessionSidebar,
  WorkspaceDrawer, AppConfirm, AppToast, AppPageLoader, useTheme, confirmDanger, toast
} from '../src/index.js'

const theme = useTheme()
const page = ref('chat')

const user = { nickName: '演示用户', userName: 'demo' }
const currentAgent = { agentName: '研究员', name: '研究员' }
const models = [
  { modelId: 1, modelName: 'glm-4.6' },
  { modelId: 2, modelName: 'glm-4.5-air' }
]
const sessions = [
  { sessionId: 's1', title: '仓库结构分析', updateTime: Date.now() },
  { sessionId: 's2', title: '周报草稿', updateTime: Date.now() - 86400000 }
]
const userMessages = [
  { messageId: 1, content: '帮我看看这个仓库的结构', createTime: Date.now() - 60000 },
  { messageId: 2, content: '总结一下核心模块', createTime: Date.now() }
]

const mockTurn = {
  userMsg: { messageType: 'USER', content: '帮我看看这个仓库的结构', messageId: 1 },
  steps: [
    { type: 'reasoning', text: '用户想了解仓库结构,先列目录再总结。', stepId: 'r1', streaming: false },
    {
      type: 'tool', name: 'searchKnowledge', source: 'builtin', stepId: 't1', streaming: false,
      args: '{"query":"仓库 结构"}', result: '命中 3 条相关片段…', ok: true, ms: 320
    },
    {
      type: 'agent', name: 'research', agentCode: 'research', invId: 'i1', stepId: 'a1',
      result: '子代理结论:这是一个 Java 多模块仓库…', ok: true, ms: 2100, streaming: false,
      steps: [
        { type: 'reasoning', text: '先看根目录…', stepId: 'a1r', streaming: false },
        { type: 'tool', name: 'shell', source: 'builtin', stepId: 'a1t', args: 'ls -la', result: 'pom.xml …', ok: true, ms: 45, streaming: false }
      ]
    },
    { type: 'content', text: '这是一个基于 RuoYi 的 Java 多模块仓库,核心模块包括…', stepId: 'answer', streaming: false }
  ],
  completed: true,
  usage: { promptTokens: 120, completionTokens: 300, totalTokens: 420, modelName: 'glm-4.6', usageSource: '1' },
  citations: [],
  workspaceChanges: []
}

const streamingTurn = {
  userMsg: { messageType: 'USER', content: '继续', messageId: 2 },
  steps: [
    { type: 'reasoning', text: '用户要继续…', stepId: 'r2', streaming: true },
    { type: 'content', text: '好的,接着上面说:', stepId: 'answer2', streaming: true }
  ],
  completed: false
}

const drawerVisible = ref(false)
const contextUsage = { used: 32000, budget: 128000, threshold: 0.85, trustworthy: true }

async function onDangerDemo() {
  const ok = await confirmDanger('需要确认', '演示:是否允许执行危险操作「rm -rf /tmp/demo」?')
  toast(ok ? '已允许(演示)' : '已拒绝(演示)')
}
</script>

<template>
  <div class="pg">
    <header class="pg-bar">
      <strong>@agenthub-cloud/ui playground</strong>
      <nav>
        <button v-for="p in ['chat', 'welcome', 'input', 'sidebar', 'meter', 'misc']" :key="p"
          :class="{ active: page === p }" @click="page = p">{{ p }}</button>
      </nav>
      <span class="pg-spacer" />
      <button @click="theme.toggleTheme()">主题:{{ theme.mode.value }}(当前{{ theme.isDark.value ? '暗' : '亮' }})</button>
    </header>

    <main class="ah-scope pg-body">
      <section v-if="page === 'chat'" class="pg-chat">
        <ChatTimeline :user-messages="userMessages" :active-message-id="1" @jump="id => console.log('jump', id)" />
        <div class="pg-turns">
          <ChatMessage :turn="mockTurn" :is-last="false" session-id="s1" />
          <ChatMessage :turn="streamingTurn" :is-last="true" session-id="s1" />
        </div>
      </section>

      <section v-else-if="page === 'welcome'" class="pg-welcome">
        <ChatWelcome :current-agent="currentAgent" :user="user" />
        <hr />
        <ChatWelcome :current-agent="currentAgent" :user="user" :show-agent-badge="true" />
      </section>

      <section v-else-if="page === 'input'" class="pg-input">
        <MessageInput :streaming="false" :models="models" :model-id="1" :session-id="'s1'" :context-usage="contextUsage" :show-meter="true" @send="p => console.log('send', p)" />
        <hr />
        <MessageInput :streaming="true" :models="models" :model-id="1" :session-id="'s1'" :compact="true" />
      </section>

      <section v-else-if="page === 'sidebar'" class="pg-sidebar">
        <SessionSidebar :sessions="sessions" current-session-id="s1" :user="user" :show-app-entries="true" @new="() => {}" />
      </section>

      <section v-else-if="page === 'meter'" class="pg-meter">
        <ContextMeter :usage="contextUsage" session-id="s1" />
      </section>

      <section v-else-if="page === 'misc'" class="pg-misc">
        <button @click="onDangerDemo">confirmDanger 演示</button>
        <button @click="toast('演示 toast')">toast 演示</button>
        <button @click="drawerVisible = true">打开 WorkspaceDrawer</button>
        <AppPageLoader label="加载中(演示)" />
        <AppConfirm />
        <AppToast />
        <WorkspaceDrawer :visible="drawerVisible" session-id="s1" @close="drawerVisible = false" />
      </section>
    </main>
  </div>
</template>

<style>
.pg { display: flex; flex-direction: column; height: 100vh; }
.pg-bar {
  display: flex; align-items: center; gap: 12px; padding: 8px 14px;
  border-bottom: 1px solid var(--border); background: var(--bg-raised); color: var(--text);
}
.pg-bar nav { display: flex; gap: 6px; }
.pg-bar button { padding: 4px 10px; border-radius: 6px; color: var(--text); }
.pg-bar button.active { background: var(--accent-weak); color: var(--accent); }
.pg-spacer { flex: 1; }
.pg-body { flex: 1; overflow: auto; padding: 16px; background: var(--bg); color: var(--text); }
.pg-chat { display: flex; gap: 16px; }
.pg-turns { flex: 1; display: flex; flex-direction: column; gap: 18px; }
.pg-welcome hr, .pg-input hr { margin: 24px 0; border-color: var(--divider); }
.pg-sidebar { width: 320px; }
.pg-misc { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
</style>
