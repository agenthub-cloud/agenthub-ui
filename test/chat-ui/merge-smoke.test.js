/** 分叉合并组件冒烟:最小 props 挂载不断言渲染细节,只断言不抛错。 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatWelcome from '../../src/chat-ui/components/ChatWelcome.vue'
import MessageInput from '../../src/chat-ui/components/MessageInput.vue'
import ContextMeter from '../../src/chat-ui/components/ContextMeter.vue'
import ChatTimeline from '../../src/chat-ui/components/ChatTimeline.vue'
import ChatHeader from '../../src/chat-ui/components/ChatHeader.vue'
import TracePanel from '../../src/chat-ui/components/TracePanel.vue'

const usage = {
  used: 32000,
  budget: 128000,
  threshold: 102400,
  percent: 25,
  segments: [{ key: 'system', label: '系统', tokens: 4000 }],
  metrics: [{ key: 'cacheHitRate', label: 'Token 命中率', value: 62.5, unit: 'percent' }],
  peakUsed: 64000,
  spend: {
    totalTokens: 90000,
    promptTokens: 70000,
    completionTokens: 20000,
    callCount: 12,
    agents: [
      { agentId: 1, role: 'supervisor', agentName: '主智能体', tokens: 50000 },
      { agentId: 2, agentName: '检索员', tokens: 40000 }
    ]
  }
}

const spans = [
  { spanId: 't1', parentSpanId: null, spanType: 'turn', startedAt: '2026-09-06T10:00:00Z' },
  { spanId: 'l1', parentSpanId: 't1', spanType: 'llm', modelName: 'glm-4', startedAt: '2026-09-06T10:00:01Z', finishedAt: '2026-09-06T10:00:04Z', durationMs: 3000, totalTokens: 1200 },
  { spanId: 'tool1', parentSpanId: 't1', spanType: 'tool', toolName: 'web_search', status: 'ok', startedAt: '2026-09-06T10:00:02Z', finishedAt: '2026-09-06T10:00:03Z', durationMs: 900, totalTokens: 0 }
]

describe('chat-ui 分叉合并冒烟(阶段 2 Task 4)', () => {
  it('ChatWelcome 默认不显示徽标,showAgentBadge 时显示', () => {
    const off = mount(ChatWelcome, { props: { user: { nickName: '测试' } } })
    expect(off.find('.chat-welcome__badge').exists()).toBe(false)
    const on = mount(ChatWelcome, { props: { user: { nickName: '测试' }, showAgentBadge: true } })
    expect(on.find('.chat-welcome__badge').exists()).toBe(true)
  })

  it('MessageInput 全尺寸与 compact 两种形态都能挂载', () => {
    const full = mount(MessageInput, { props: { streaming: true } })
    expect(full.exists()).toBe(true)
    const compact = mount(MessageInput, { props: { streaming: true, compact: true, connectionState: 'reconnecting' } })
    expect(compact.find('.chat-input-wrapper--compact').exists()).toBe(true)
    expect(compact.text()).toContain('连接恢复中…')
  })

  it('ContextMeter 挂载并弹出面板:增强口径(峰值/消耗/指标)与旧口径回退', async () => {
    const enhanced = mount(ContextMeter, { props: { usage, attachTo: document.body } })
    await enhanced.find('.ctx-meter').trigger('click')
    expect(document.querySelectorAll('.ctx-meter-popper').length).toBeGreaterThan(0)
    enhanced.unmount()

    // 旧口径:无 agents 明细,回退 desktop 摘要行
    const legacy = mount(ContextMeter, { props: { usage: { ...usage, spend: { totalTokens: 90000 } }, attachTo: document.body } })
    await legacy.find('.ctx-meter').trigger('click')
    expect(document.body.textContent).toContain('本会话总 Token')
    legacy.unmount()
  })

  it('ChatTimeline 挂载用户消息音轨', () => {
    const w = mount(ChatTimeline, {
      props: {
        userMessages: [{ messageId: 1, content: '第一问', createTime: '2026-09-06 10:00:00' }],
        activeMessageId: 1
      }
    })
    expect(w.findAll('.chat-timeline__bar').length).toBe(1)
  })

  it('ChatHeader 挂载,更多菜单点外收起(command 语义不变)', async () => {
    const w = mount(ChatHeader, { props: { title: '会话', hasTurns: true } })
    await w.find('[title="更多"]').trigger('click')
    expect(w.find('.chat-menu').exists()).toBe(true)
    await w.find('.chat-menu__item').trigger('click')
    expect(w.emitted('command')[0]).toEqual(['traces'])
  })

  it('TracePanel 挂载:概览 + 下钻数据均 props 注入', async () => {
    const w = mount(TracePanel, {
      props: { sessionId: 's1', overview: [{ runId: 'r1', startedAt: '2026-09-06T10:00:00Z', llmCount: 2, toolCount: 1 }], attachTo: document.body }
    })
    const run = document.body.querySelector('.trace-run')
    expect(run).toBeTruthy()
    run.click()
    await w.vm.$nextTick()
    expect(w.emitted('open-run')[0]).toEqual(['r1'])
    await w.setProps({ currentRun: { runId: 'r1', startedAt: '2026-09-06T10:00:00Z' }, spans })
    expect(document.body.querySelector('.trow')).toBeTruthy()
  })
})
